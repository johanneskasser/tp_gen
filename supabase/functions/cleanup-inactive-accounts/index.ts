/**
 * cleanup-inactive-accounts
 *
 * Scheduled Edge Function that enforces the 1-year inactivity policy:
 *   - After 11 months of inactivity → send warning email
 *   - After 12 months of inactivity → delete the account
 *
 * Trigger: Call this function daily via pg_cron, an external cron service,
 * or the Supabase Dashboard → Edge Functions → Schedule.
 *
 * Required environment variables (set in Supabase Dashboard → Settings → Secrets):
 *   SUPABASE_URL              – Your project URL
 *   SUPABASE_SERVICE_ROLE_KEY – Service-role key (bypasses RLS)
 *   RESEND_API_KEY            – Resend API key for sending emails
 *   APP_URL                   – Public URL of the app (e.g. https://zenit-it.fit)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// ─── Config ──────────────────────────────────────────────────────────────────

const WARNING_MONTHS = 11; // send warning after this many months of inactivity
const DELETE_MONTHS  = 12; // delete account after this many months of inactivity

// ─── Types ───────────────────────────────────────────────────────────────────

interface UserToWarn {
  id: string;
  email: string;
  full_name: string;
}

interface UserToDelete {
  id: string;
  email: string;
}

// ─── Handler ─────────────────────────────────────────────────────────────────

serve(async (_req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) throw new Error('RESEND_API_KEY not configured');

    const appUrl = Deno.env.get('APP_URL') ?? 'https://zenit-it.fit';
    const now    = new Date();

    // Build cutoff timestamps
    const warningCutoff = new Date(now);
    warningCutoff.setMonth(warningCutoff.getMonth() - WARNING_MONTHS);

    const deleteCutoff = new Date(now);
    deleteCutoff.setMonth(deleteCutoff.getMonth() - DELETE_MONTHS);

    // ── Step 1: warn users inactive for 11 months ─────────────────────────

    const { data: usersToWarn, error: warnError } = await supabase
      .rpc('get_users_for_inactivity_warning', {
        warning_cutoff: warningCutoff.toISOString(),
        delete_cutoff:  deleteCutoff.toISOString(),
      }) as { data: UserToWarn[] | null; error: unknown };

    if (warnError) {
      console.error('Error fetching users to warn:', warnError);
    }

    const warnedIds: string[] = [];

    for (const user of (usersToWarn ?? [])) {
      const sent = await sendWarningEmail(user, resendApiKey, appUrl, deleteCutoff);
      if (sent) {
        await supabase.rpc('mark_deletion_warning_sent', { user_uuid: user.id });
        warnedIds.push(user.id);
        console.log(`Warning email sent to ${user.email}`);
      } else {
        console.error(`Failed to send warning email to ${user.email}`);
      }
    }

    // ── Step 2: delete users inactive for 12 months ───────────────────────

    const { data: usersToDelete, error: deleteError } = await supabase
      .rpc('get_users_for_deletion', {
        delete_cutoff: deleteCutoff.toISOString(),
      }) as { data: UserToDelete[] | null; error: unknown };

    if (deleteError) {
      console.error('Error fetching users to delete:', deleteError);
    }

    const deletedIds: string[] = [];

    for (const user of (usersToDelete ?? [])) {
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      if (error) {
        console.error(`Failed to delete user ${user.id} (${user.email}):`, error);
      } else {
        deletedIds.push(user.id);
        console.log(`Deleted inactive account: ${user.email}`);
      }
    }

    // ── Summary ───────────────────────────────────────────────────────────

    const summary = {
      success:      true,
      run_at:       now.toISOString(),
      warned_count: warnedIds.length,
      deleted_count: deletedIds.length,
      warned_ids:   warnedIds,
      deleted_ids:  deletedIds,
    };

    console.log('Cleanup run complete:', summary);

    return new Response(JSON.stringify(summary), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Fatal error in cleanup-inactive-accounts:', message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

// ─── Email sender ─────────────────────────────────────────────────────────────

async function sendWarningEmail(
  user: UserToWarn,
  resendApiKey: string,
  appUrl: string,
  deletionDate: Date,
): Promise<boolean> {
  const formattedDeletionDate = deletionDate.toLocaleDateString('de-AT', {
    day:   '2-digit',
    month: 'long',
    year:  'numeric',
  });

  const payload = {
    from:    'zenit-it.fit <noreply@zenit-it.fit>',
    to:      user.email,
    subject: '⚠️ Dein Konto wird bald automatisch gelöscht — bitte jetzt einloggen',
    html:    generateWarningEmailHTML(user.full_name, formattedDeletionDate, appUrl),
  };

  const response = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('Resend error:', text);
    return false;
  }
  return true;
}

// ─── Email template ───────────────────────────────────────────────────────────

function generateWarningEmailHTML(
  fullName: string,
  deletionDate: string,
  appUrl: string,
): string {
  const loginUrl = `${appUrl}/login`;

  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      background: #f3f4f6;
      margin: 0;
      padding: 0;
      color: #333;
    }
    .container {
      max-width: 580px;
      margin: 32px auto;
      background: #fff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    .header {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: #fff;
      padding: 32px 28px;
      text-align: center;
    }
    .header h1 { margin: 0 0 8px 0; font-size: 22px; font-weight: 700; }
    .header p  { margin: 0; opacity: 0.9; font-size: 14px; }
    .body  { padding: 28px; }
    .body p    { line-height: 1.7; margin: 0 0 16px 0; }
    .highlight {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 14px 18px;
      border-radius: 6px;
      margin: 20px 0;
      font-size: 15px;
    }
    .cta {
      text-align: center;
      margin: 28px 0 20px;
    }
    .cta a {
      background: #2563eb;
      color: #fff;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      display: inline-block;
    }
    .footer {
      background: #f9fafb;
      padding: 18px 28px;
      font-size: 12px;
      color: #6b7280;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer a { color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Dein Konto wird bald gelöscht</h1>
      <p>Automatische Benachrichtigung von zenit-it.fit</p>
    </div>
    <div class="body">
      <p>Hallo ${escapeHtml(fullName)},</p>
      <p>
        wir haben festgestellt, dass du dich seit über <strong>11 Monaten</strong>
        nicht mehr bei <strong>zenit-it.fit</strong> eingeloggt hast.
      </p>
      <div class="highlight">
        <strong>Wichtig:</strong> Gemäß unserer Datenschutzrichtlinie (DSGVO-Datensparsamkeit)
        wird dein Konto und alle zugehörigen Daten automatisch am
        <strong>${deletionDate}</strong> gelöscht, sofern du dich bis dahin nicht
        erneut einloggst.
      </div>
      <p>
        Wenn du dein Konto behalten möchtest, musst du dich lediglich einmal einloggen –
        das setzt die Inaktivitätsfrist zurück.
      </p>
      <div class="cta">
        <a href="${loginUrl}">Jetzt einloggen &amp; Konto behalten</a>
      </div>
      <p>
        Falls du dein Konto und deine Daten <em>nicht</em> behalten möchtest, musst du
        nichts tun — sie werden am oben genannten Datum automatisch gelöscht.
      </p>
      <p>
        Bei Fragen erreichst du uns jederzeit unter
        <a href="mailto:support@zenit-it.fit">support@zenit-it.fit</a>.
      </p>
    </div>
    <div class="footer">
      <p>
        Diese E-Mail wurde automatisch verschickt, weil dein Konto bei
        <a href="${appUrl}">zenit-it.fit</a> als inaktiv markiert wurde.<br />
        zenit-it · Johannes Kasser · Herklotzgasse 10 · 1150 Wien · Österreich
      </p>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
