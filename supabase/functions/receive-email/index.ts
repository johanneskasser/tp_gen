import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Forwarding destination for all inbound emails
const FORWARD_TO = Deno.env.get('EMAIL_FORWARD_TO') ?? '';

// Addresses we actively handle (others are still forwarded, just without special routing labels)
const KNOWN_ADDRESSES: Record<string, string> = {
  'datenschutz@zenit-it.fit': 'Datenschutz',
  'support@zenit-it.fit': 'Support',
};

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    // Read the raw payload for signature verification
    const rawBody = await req.text();
    const webhookSecret = Deno.env.get('RESEND_WEBHOOK_SECRET');

    if (webhookSecret) {
      const isValid = await verifyWebhookSignature(req.headers, rawBody, webhookSecret);
      if (!isValid) {
        console.error('Invalid webhook signature');
        return new Response('Unauthorized', { status: 401 });
      }
    } else {
      console.warn('RESEND_WEBHOOK_SECRET not set — skipping signature verification');
    }

    const event = JSON.parse(rawBody);

    if (event.type !== 'email.received') {
      // Acknowledge but ignore other event types
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { email_id, from, to, subject } = event.data;

    console.log(`Received email ${email_id} — from: ${from}, to: ${to}, subject: ${subject}`);

    // Fetch full email body from Resend Received Emails API
    const receivedEmailRes = await fetch(
      `https://api.resend.com/emails/receiving/${email_id}`,
      {
        headers: { Authorization: `Bearer ${resendApiKey}` },
      }
    );

    let htmlBody: string | undefined;
    let textBody: string | undefined;

    if (receivedEmailRes.ok) {
      const receivedEmail = await receivedEmailRes.json();
      htmlBody = receivedEmail.html;
      textBody = receivedEmail.text;
    } else {
      console.error(
        `Failed to fetch received email ${email_id}: ${receivedEmailRes.statusText}`
      );
    }

    // Determine routing label from the "to" address
    const toAddresses: string[] = Array.isArray(to) ? to : [to];
    const matchedLabel =
      toAddresses
        .map((addr) => KNOWN_ADDRESSES[addr.toLowerCase()])
        .find(Boolean) ?? toAddresses[0];

    const forwardSubject = `[${matchedLabel}] ${subject ?? '(kein Betreff)'}`;

    const forwardedHtml = buildForwardedHtml({
      originalFrom: from,
      originalTo: toAddresses.join(', '),
      originalSubject: subject,
      htmlBody,
      textBody,
    });

    // Send the forwarded email via Resend
    const sendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'zenit-it Posteingang <noreply@zenit-it.fit>',
        to: FORWARD_TO,
        subject: forwardSubject,
        html: forwardedHtml,
        // Reply-To so replies go back to the original sender
        reply_to: from,
      }),
    });

    if (!sendRes.ok) {
      const errText = await sendRes.text();
      console.error('Resend send error:', errText);
      throw new Error(`Failed to forward email: ${sendRes.statusText}`);
    }

    const sendData = await sendRes.json();
    console.log('Email forwarded successfully:', sendData.id);

    return new Response(JSON.stringify({ success: true, forwardedId: sendData.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in receive-email function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// ---------------------------------------------------------------------------
// Svix-compatible HMAC-SHA256 webhook signature verification
// ---------------------------------------------------------------------------
async function verifyWebhookSignature(
  headers: Headers,
  rawBody: string,
  secret: string
): Promise<boolean> {
  const svixId = headers.get('svix-id');
  const svixTimestamp = headers.get('svix-timestamp');
  const svixSignatures = headers.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignatures) return false;

  // Reject messages older than 5 minutes
  const ts = parseInt(svixTimestamp, 10);
  if (isNaN(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return false;

  const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`;

  // The secret from Resend dashboard is base64-encoded; strip the "whsec_" prefix
  const rawSecret = secret.startsWith('whsec_') ? secret.slice(6) : secret;
  const keyBytes = Uint8Array.from(atob(rawSecret), (c) => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(signedContent)
  );

  const computedSig = `v1,${btoa(String.fromCharCode(...new Uint8Array(signature)))}`;

  // Resend may send multiple signatures; at least one must match
  return svixSignatures.split(' ').some((sig) => sig === computedSig);
}

// ---------------------------------------------------------------------------
// Build a clean HTML email for the forwarded message
// ---------------------------------------------------------------------------
function buildForwardedHtml(opts: {
  originalFrom: string;
  originalTo: string;
  originalSubject?: string;
  htmlBody?: string;
  textBody?: string;
}): string {
  const { originalFrom, originalTo, originalSubject, htmlBody, textBody } = opts;

  const bodyContent = htmlBody
    ? htmlBody
    : textBody
    ? `<pre style="white-space:pre-wrap;font-family:inherit;">${escapeHtml(textBody)}</pre>`
    : '<p style="color:#6b7280;font-style:italic;">Kein Inhalt gefunden.</p>';

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:640px;margin:20px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,.1);">

    <!-- Header banner -->
    <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:24px 28px;">
      <p style="margin:0 0 4px;font-size:12px;opacity:.8;text-transform:uppercase;letter-spacing:.08em;">Weitergeleitete E-Mail</p>
      <h1 style="margin:0;font-size:20px;font-weight:600;">📬 ${escapeHtml(originalSubject ?? '(kein Betreff)')}</h1>
    </div>

    <!-- Metadata -->
    <table style="width:100%;border-collapse:collapse;font-size:13px;background:#f9fafb;border-bottom:1px solid #e5e7eb;">
      <tr>
        <td style="padding:10px 28px;color:#6b7280;white-space:nowrap;font-weight:600;">Von</td>
        <td style="padding:10px 28px 10px 0;color:#111827;">${escapeHtml(originalFrom)}</td>
      </tr>
      <tr style="border-top:1px solid #e5e7eb;">
        <td style="padding:10px 28px;color:#6b7280;white-space:nowrap;font-weight:600;">An</td>
        <td style="padding:10px 28px 10px 0;color:#111827;">${escapeHtml(originalTo)}</td>
      </tr>
    </table>

    <!-- Original body -->
    <div style="padding:28px;color:#1f2937;line-height:1.6;font-size:15px;">
      ${bodyContent}
    </div>

    <div style="padding:16px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;text-align:center;">
      Automatisch weitergeleitet von zenit-it.fit
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
