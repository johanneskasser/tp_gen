/**
 * GoTrue Auth Email Hook
 *
 * GoTrue calls this function instead of sending emails via SMTP.
 * Configured via: GOTRUE_HOOK_SEND_EMAIL_ENABLED=true
 *                 GOTRUE_HOOK_SEND_EMAIL_URI=http://edge-runtime:9000/functions/v1/send-auth-email
 *                 GOTRUE_HOOK_SEND_EMAIL_SECRETS=v1,whsec_<GOTRUE_HOOK_SECRET>
 *
 * Docs: https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const FROM_EMAIL = Deno.env.get('AUTH_EMAIL_FROM') ?? 'noreply@zenit-it.fit';
const FROM_NAME = Deno.env.get('AUTH_EMAIL_FROM_NAME') ?? 'zenit-it';
const HOOK_SECRET = Deno.env.get('GOTRUE_HOOK_SECRET') ?? '';

// ─── Webhook signature verification ─────────────────────────────────────────

async function verifySignature(body: string, signatureHeader: string | null): Promise<boolean> {
  if (!HOOK_SECRET || !signatureHeader) return false;

  // Header format: "v1=<hex-digest>"
  const [version, receivedHex] = signatureHeader.split('=');
  if (version !== 'v1' || !receivedHex) return false;

  // Secret is stored without the "whsec_" prefix in GOTRUE_HOOK_SECRET
  const keyBytes = new TextEncoder().encode(HOOK_SECRET);
  const bodyBytes = new TextEncoder().encode(body);

  const key = await crypto.subtle.importKey(
    'raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, bodyBytes);
  const computedHex = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return computedHex === receivedHex;
}

// ─── Email templates ─────────────────────────────────────────────────────────

interface EmailData {
  token: string;
  token_hash: string;
  redirect_to: string;
  email_action_type: string;
  site_url: string;
  token_new?: string;
  token_hash_new?: string;
}

interface HookPayload {
  user: { email: string; new_email?: string };
  email_data: EmailData;
}

function buildVerifyUrl(data: EmailData): string {
  const params = new URLSearchParams({
    token: data.token_hash,
    type: data.email_action_type,
    redirect_to: data.redirect_to || data.site_url,
  });
  return `${data.site_url}/auth/v1/verify?${params}`;
}

function getEmailContent(payload: HookPayload): { subject: string; html: string } {
  const { email_data, user } = payload;
  const url = buildVerifyUrl(email_data);

  const base = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,.1)">
      <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:32px 24px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700">zenit-it</h1>
        <p style="color:rgba(255,255,255,.85);margin:8px 0 0;font-size:14px">Trainingspläne für Läufer</p>
      </div>
      <div style="padding:32px 24px">
        CONTENT
      </div>
      <div style="background:#f9fafb;padding:16px 24px;text-align:center;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb">
        © zenit-it — Trainingspläne für Läufer
      </div>
    </div>
  `;

  const btn = (href: string, label: string) =>
    `<a href="${href}" style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;margin:24px 0">${label}</a>`;

  const fallback = (href: string) =>
    `<p style="margin-top:24px;font-size:12px;color:#6b7280">Falls der Button nicht funktioniert, kopiere diesen Link: <br><a href="${href}" style="color:#667eea;word-break:break-all">${href}</a></p>`;

  switch (email_data.email_action_type) {
    case 'signup':
    case 'email_change_confirmation':
      return {
        subject: 'E-Mail-Adresse bestätigen — zenit-it',
        html: base.replace('CONTENT', `
          <h2 style="margin:0 0 8px;color:#111827">E-Mail-Adresse bestätigen</h2>
          <p style="color:#6b7280;margin:0 0 24px">Klicke auf den Button um deine E-Mail-Adresse zu bestätigen und loszulegen.</p>
          ${btn(url, 'E-Mail bestätigen')}
          <p style="color:#6b7280;margin:0;font-size:14px">Dieser Link läuft in 24 Stunden ab.</p>
          ${fallback(url)}
        `),
      };

    case 'recovery':
      return {
        subject: 'Passwort zurücksetzen — zenit-it',
        html: base.replace('CONTENT', `
          <h2 style="margin:0 0 8px;color:#111827">Passwort zurücksetzen</h2>
          <p style="color:#6b7280;margin:0 0 24px">Du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt.</p>
          ${btn(url, 'Passwort zurücksetzen')}
          <p style="color:#6b7280;margin:0;font-size:14px">Falls du das nicht warst, kannst du diese E-Mail ignorieren.</p>
          ${fallback(url)}
        `),
      };

    case 'magiclink':
      return {
        subject: 'Dein Login-Link — zenit-it',
        html: base.replace('CONTENT', `
          <h2 style="margin:0 0 8px;color:#111827">Magic Link</h2>
          <p style="color:#6b7280;margin:0 0 24px">Klicke auf den Button um dich einzuloggen.</p>
          ${btn(url, 'Einloggen')}
          <p style="color:#6b7280;margin:0;font-size:14px">Dieser Link läuft in 1 Stunde ab und kann nur einmal verwendet werden.</p>
          ${fallback(url)}
        `),
      };

    case 'invite':
      return {
        subject: 'Einladung zu zenit-it',
        html: base.replace('CONTENT', `
          <h2 style="margin:0 0 8px;color:#111827">Du wurdest eingeladen!</h2>
          <p style="color:#6b7280;margin:0 0 24px">Du hast eine Einladung zu zenit-it erhalten.</p>
          ${btn(url, 'Einladung annehmen')}
          ${fallback(url)}
        `),
      };

    case 'reauthentication':
      return {
        subject: 'Sicherheitscode — zenit-it',
        html: base.replace('CONTENT', `
          <h2 style="margin:0 0 8px;color:#111827">Sicherheitscode</h2>
          <p style="color:#6b7280;margin:0 0 8px">Dein Einmal-Code lautet:</p>
          <p style="font-size:32px;font-weight:700;letter-spacing:8px;color:#667eea;margin:16px 0">${email_data.token}</p>
          <p style="color:#6b7280;margin:0;font-size:14px">Dieser Code läuft in 10 Minuten ab.</p>
        `),
      };

    default:
      return {
        subject: 'Aktion erforderlich — zenit-it',
        html: base.replace('CONTENT', `
          <h2 style="margin:0 0 8px;color:#111827">Aktion erforderlich</h2>
          ${btn(url, 'Fortfahren')}
          ${fallback(url)}
        `),
      };
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const rawBody = await req.text();

  const isValid = await verifySignature(rawBody, req.headers.get('x-webhook-signature'));
  if (!isValid) {
    console.error('[send-auth-email] Invalid webhook signature');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  let payload: HookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { subject, html } = getEmailContent(payload);
  const toEmail = payload.email_data.email_action_type === 'email_change_confirmation'
    ? payload.user.new_email ?? payload.user.email
    : payload.user.email;

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [toEmail],
      subject,
      html,
    }),
  });

  if (!resendRes.ok) {
    const err = await resendRes.text();
    console.error('[send-auth-email] Resend error:', err);
    return new Response(JSON.stringify({ error: 'Email send failed' }), { status: 500 });
  }

  const result = await resendRes.json();
  console.log('[send-auth-email] Sent:', result.id, '→', toEmail, '(', payload.email_data.email_action_type, ')');

  return new Response(JSON.stringify({ message: 'Email sent', id: result.id }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
