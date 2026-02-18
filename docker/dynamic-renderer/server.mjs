/**
 * Dynamic Renderer — Puppeteer pre-rendering server
 *
 * Architecture:
 *   nginx (detects bot User-Agent) → this service → Puppeteer opens app:8080 → returns HTML
 *
 * Inspired by: https://github.com/anhchangvt1994/dynamic-rendering-ultra-generation__vite-react
 *
 * Environment variables:
 *   APP_ORIGIN         - Origin of the React app (default: http://app:8080)
 *   PORT               - Port to listen on (default: 3000)
 *   CACHE_TTL_SECONDS  - How long to cache rendered pages (default: 3600)
 */

import express from 'express';
import puppeteer from 'puppeteer-core';

const APP_ORIGIN = process.env.APP_ORIGIN || 'http://app:8080';
const PORT = parseInt(process.env.PORT || '3000', 10);
const CACHE_TTL_MS = parseInt(process.env.CACHE_TTL_SECONDS || '3600', 10) * 1000;

// Simple in-memory LRU-style cache
const cache = new Map();

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.html;
}

function setCache(key, html) {
  // Limit cache to 200 entries (evict oldest)
  if (cache.size >= 200) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  cache.set(key, { html, timestamp: Date.now() });
}

// Launch a single shared browser instance
let browser = null;

async function getBrowser() {
  if (browser && browser.isConnected()) return browser;
  browser = await puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-extensions',
    ],
  });
  browser.on('disconnected', () => { browser = null; });
  return browser;
}

async function renderPage(path) {
  const url = `${APP_ORIGIN}${path}`;
  const cached = getCached(url);
  if (cached) {
    console.log(`[cache hit] ${url}`);
    return cached;
  }

  console.log(`[rendering] ${url}`);
  const b = await getBrowser();
  const page = await b.newPage();

  try {
    // Block unnecessary resources to speed up rendering
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const type = req.resourceType();
      if (['image', 'media', 'font', 'websocket'].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // Wait for the root element to be populated (React hydration done)
    await page.waitForSelector('#root > *', { timeout: 15000 }).catch(() => {});

    const html = await page.content();
    setCache(url, html);
    return html;
  } finally {
    await page.close();
  }
}

// ─── Express app ──────────────────────────────────────────────────────────────

const app = express();

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Render any path
app.get('*', async (req, res) => {
  const path = req.originalUrl;

  // Skip non-HTML requests
  const ext = path.split('?')[0].split('.').pop();
  if (['js', 'css', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'woff', 'woff2', 'json', 'xml'].includes(ext)) {
    return res.status(404).end();
  }

  try {
    const html = await renderPage(path);
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.set('X-Dynamic-Render', 'true');
    res.send(html);
  } catch (err) {
    console.error(`[error] ${path}:`, err.message);
    // Fallback: let nginx serve the SPA directly
    res.status(500).send('Render failed');
  }
});

app.listen(PORT, () => {
  console.log(`Dynamic renderer listening on :${PORT}`);
  console.log(`App origin: ${APP_ORIGIN}`);
  console.log(`Cache TTL: ${CACHE_TTL_MS / 1000}s`);
  // Pre-warm browser
  getBrowser().then(() => console.log('Browser ready')).catch(console.error);
});
