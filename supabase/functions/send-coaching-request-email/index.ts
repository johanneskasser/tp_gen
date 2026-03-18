// supabase/functions/send-coaching-request-email/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get caller identity from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

    const { requestId } = await req.json();

    // Fetch request and verify caller is the coach
    const { data: request, error } = await supabaseAdmin
      .from('coaching_requests')
      .select('*, coach:user_profiles!coach_id(id, username, full_name), athlete:user_profiles!athlete_id(id, username, full_name)')
      .eq('id', requestId)
      .single();

    if (error || !request) throw new Error('Request not found');
    if (request.coach_id !== user.id) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders });

    // Get athlete email
    const { data: athleteAuth } = await supabaseAdmin.auth.admin.getUserById(request.athlete_id);
    const athleteEmail = athleteAuth?.user?.email;
    if (!athleteEmail) throw new Error('Athlete email not found');

    // Create notification
    await supabaseAdmin.from('notifications').insert({
      user_id: request.athlete_id,
      type: 'coaching_request',
      payload: {
        request_id: requestId,
        coach: { id: request.coach.id, username: request.coach.username, full_name: request.coach.full_name },
      },
    });

    // Send email via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) throw new Error('RESEND_API_KEY not configured');

    const coachName = request.coach.full_name || `@${request.coach.username}`;
    const appUrl = Deno.env.get('APP_URL') ?? 'https://app.zenit-it.fit';

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'zenit-it Training <noreply@zenit-it.fit>',
        to: athleteEmail,
        subject: `${coachName} möchte dir einen Trainingsplan erstellen`,
        html: generateRequestEmailHTML(coachName, request.coach.username, appUrl),
      }),
    });

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), { status: 400, headers: corsHeaders });
  }
});

function generateRequestEmailHTML(coachName: string, coachUsername: string, appUrl: string): string {
  return `
<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f3f4f6; margin: 0; }
.container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
.header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 30px 20px; text-align: center; }
.content { padding: 24px; }
.btn { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; }
.footer { background: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #6b7280; }
</style></head><body>
<div class="container">
  <div class="header"><h1>🏃 Coaching-Anfrage</h1></div>
  <div class="content">
    <p><strong>${coachName}</strong> (@${coachUsername}) möchte dir einen personalisierten Trainingsplan erstellen.</p>
    <p>Dafür benötigt ${coachName} Zugriff auf deine Trainingszonen und deinen VDOT-Wert, um die Intensitäten optimal auf dich abzustimmen.</p>
    <p>Du kannst die Anfrage in deiner Mitteilungszentrale genehmigen oder ablehnen:</p>
    <p><a href="${appUrl}/dashboard" class="btn">Anfrage ansehen</a></p>
  </div>
  <div class="footer"><p>Du erhältst diese E-Mail, weil jemand eine Coaching-Anfrage gestellt hat.</p></div>
</div></body></html>`;
}
