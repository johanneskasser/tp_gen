/**
 * Dynamic Renderer — Puppeteer pre-rendering server
 *
 * Architecture:
 *   nginx (detects bot User-Agent) → this service → Puppeteer opens app:8080 → returns HTML
 *
 * Key: Supabase API calls (https://zenit-it.fit/rest/v1 etc.) are intercepted
 * and rewritten to the internal Kong URL (http://kong:8000) to avoid SSL issues
 * within the Docker network.
 *
 * Environment variables:
 *   APP_ORIGIN         - Origin of the React app (default: http://app:8080)
 *   SUPABASE_PUBLIC_URL - External Supabase URL to intercept (default: https://zenit-it.fit)
 *   SUPABASE_INTERNAL_URL - Internal Kong URL to rewrite to (default: http://kong:8000)
 *   PORT               - Port to listen on (default: 3000)
 *   CACHE_TTL_SECONDS  - How long to cache rendered pages (default: 3600)
 */

import express from 'express';
import puppeteer from 'puppeteer-core';

const APP_ORIGIN = process.env.APP_ORIGIN || 'http://app:8080';
const SUPABASE_PUBLIC_URL = process.env.SUPABASE_PUBLIC_URL || 'https://zenit-it.fit';
const SUPABASE_INTERNAL_URL = process.env.SUPABASE_INTERNAL_URL || 'http://kong:8000';
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
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const type = req.resourceType();

      // Block unnecessary resources to speed up rendering
      if (['image', 'media', 'font', 'websocket'].includes(type)) {
        req.abort();
        return;
      }

      // Rewrite external Supabase/API calls to internal Kong URL
      // This avoids SSL issues when Puppeteer tries to reach the external domain
      const reqUrl = req.url();
      if (reqUrl.startsWith(SUPABASE_PUBLIC_URL)) {
        const internalUrl = reqUrl.replace(SUPABASE_PUBLIC_URL, SUPABASE_INTERNAL_URL);
        console.log(`[rewrite] ${reqUrl} → ${internalUrl}`);
        req.continue({ url: internalUrl });
        return;
      }

      req.continue();
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

// ─── Dynamic sitemap ──────────────────────────────────────────────────────────
// Queries Supabase for all public plans and generates sitemap.xml

async function generateSitemap() {
  const ANON_KEY = process.env.SUPABASE_ANON_KEY;
  const headers = ANON_KEY
    ? { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }
    : {};

  const res = await fetch(
    `${SUPABASE_INTERNAL_URL}/rest/v1/training_plans?select=id,updated_at&visibility=in.(public,public_anonymous)&order=published_at.desc`,
    { headers }
  );
  const plans = await res.json();

  const staticUrls = [
    { loc: 'https://zenit-it.fit/', priority: '1.0', changefreq: 'weekly' },
    { loc: 'https://zenit-it.fit/login', priority: '0.5', changefreq: 'monthly' },
    { loc: 'https://zenit-it.fit/marketplace', priority: '0.8', changefreq: 'daily' },
  ];

  const planUrls = Array.isArray(plans) ? plans.map(p => ({
    loc: `https://zenit-it.fit/marketplace/${p.id}`,
    priority: '0.9',
    changefreq: 'weekly',
    lastmod: p.updated_at ? p.updated_at.slice(0, 10) : undefined,
  })) : [];

  const allUrls = [...staticUrls, ...planUrls];

  const urlEntries = allUrls.map(u => `
  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

// ─── Express app ──────────────────────────────────────────────────────────────

const app = express();

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Dynamic sitemap — includes all public marketplace plans
app.get('/sitemap.xml', async (_req, res) => {
  try {
    const xml = await generateSitemap();
    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (err) {
    console.error('[sitemap error]', err.message);
    res.status(500).send('Sitemap generation failed');
  }
});

// Render any path
app.get('*', async (req, res) => {
  const path = req.originalUrl;

  // Skip non-HTML requests
  const ext = path.split('?')[0].split('.').pop();
  if (['js', 'css', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'woff', 'woff2', 'json', 'xml', 'txt'].includes(ext)) {
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
  console.log(`API rewrite: ${SUPABASE_PUBLIC_URL} → ${SUPABASE_INTERNAL_URL}`);
  console.log(`Cache TTL: ${CACHE_TTL_MS / 1000}s`);
  // Pre-warm browser
  getBrowser().then(() => console.log('Browser ready')).catch(console.error);
});
