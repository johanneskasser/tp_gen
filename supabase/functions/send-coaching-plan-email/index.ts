// supabase/functions/send-coaching-plan-email/index.ts
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

    // Validate caller via JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const { planId }: { planId: string } = await req.json();
    if (!planId) throw new Error('planId is required');

    // Fetch plan (no FK join — coach_id references auth.users, not user_profiles)
    const { data: plan, error: planError } = await supabaseAdmin
      .from('training_plans')
      .select('id, name, coach_id, user_id, plan_data')
      .eq('id', planId)
      .single();

    if (planError || !plan) throw new Error('Plan not found');
    if (plan.coach_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders });
    }

    // Fetch coach profile separately
    const { data: coachProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('id, username, full_name')
      .eq('id', plan.coach_id)
      .single();

    // Get athlete email
    const { data: athleteAuth } = await supabaseAdmin.auth.admin.getUserById(plan.user_id);
    const athleteEmail = athleteAuth?.user?.email;
    if (!athleteEmail) throw new Error('Athlete email not found');

    // Build display values
    const planData = plan.plan_data;
    const distanceMap: Record<string, string> = {
      '5K': '5K', '10K': '10K', 'HM': 'Halbmarathon', 'M': 'Marathon',
    };
    const distance = distanceMap[planData?.event?.distance] || `${planData?.event?.customDistance} km`;
    const weeks = planData?.weeks?.length || 0;
    const coachName = escapeHtml(coachProfile?.full_name || `@${coachProfile?.username ?? ''}`);
    const coachUsername = escapeHtml(coachProfile?.username ?? '');
    const planName = escapeHtml(plan.name);
    const appUrl = Deno.env.get('APP_URL') ?? 'https://app.zenit-it.fit';

    // Create notification for athlete
    await supabaseAdmin.from('notifications').insert({
      user_id: plan.user_id,
      type: 'coaching_plan_received',
      payload: {
        plan_id: planId,
        plan_name: plan.name,
        distance,
        weeks,
        coach: { id: coachProfile?.id, username: coachProfile?.username, full_name: coachProfile?.full_name },
      },
    });

    // Send email via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) throw new Error('RESEND_API_KEY not configured');

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'zenit-it Training <noreply@zenit-it.fit>',
        to: athleteEmail,
        subject: `${coachName} hat dir einen Trainingsplan erstellt`,
        html: generatePlanEmailHTML(coachName, coachUsername, planName, distance, weeks, planId, appUrl),
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      throw new Error(`Resend API error: ${errorText}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 400, headers: corsHeaders }
    );
  }
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function generatePlanEmailHTML(
  coachName: string,
  coachUsername: string,
  planName: string,
  distance: string,
  weeks: number,
  planId: string,
  appUrl: string
): string {
  return `
<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f3f4f6; margin: 0; }
.container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
.header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px 20px; text-align: center; }
.content { padding: 24px; }
.plan-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0; }
.btn { display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; }
.footer { background: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #6b7280; }
</style></head><body>
<div class="container">
  <div class="header"><h1>🏃 Neuer Trainingsplan</h1></div>
  <div class="content">
    <p><strong>${coachName}</strong> (@${coachUsername}) hat einen personalisierten Trainingsplan für dich erstellt:</p>
    <div class="plan-box">
      <strong>${planName}</strong><br>
      ${distance} · ${weeks} Wochen
    </div>
    <p>Du findest den Plan in deinem Dashboard:</p>
    <p><a href="${appUrl}/dashboard" class="btn">Plan ansehen</a></p>
  </div>
  <div class="footer"><p>Diese E-Mail wurde vom zenit-it Trainingssystem generiert.</p></div>
</div></body></html>`;
}
