import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface FeedbackData {
  id: string;
  user_id: string;
  overall_rating?: number;
  features_rating?: number;
  editor_rating?: number;
  marketplace_rating?: number;
  individual_feedback?: string;
  feature_suggestion?: string;
  created_at: string;
  user_name: string;
  user_email: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key (bypasses RLS)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request body
    const { feedbackId }: { feedbackId: string } = await req.json();

    if (!feedbackId) {
      throw new Error('feedbackId is required');
    }

    // Fetch feedback details
    const { data: feedback, error: fetchError } = await supabaseClient
      .from('user_feedback')
      .select('*')
      .eq('id', feedbackId)
      .single();

    if (fetchError) {
      console.error('Error fetching feedback:', fetchError);
      throw new Error(`Failed to fetch feedback: ${fetchError.message}`);
    }

    if (!feedback) {
      throw new Error('Feedback not found');
    }

    // Fetch user details from auth.users (email) and user_profiles (name)
    const { data: authUser, error: authError } = await supabaseClient.auth.admin
      .getUserById(feedback.user_id);

    const { data: userProfile } = await supabaseClient
      .from('user_profiles')
      .select('full_name')
      .eq('id', feedback.user_id)
      .single();

    const typedFeedback = {
      ...feedback,
      user_name: userProfile?.full_name || 'Unknown User',
      user_email: authUser?.user?.email || 'N/A',
    } as FeedbackData;

    // Get Resend API key from environment
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    // Prepare email payload
    const emailPayload = {
      from: 'zenit-it Feedback <feedback@zenit-it.fit>',
      to: Deno.env.get('EMAIL_FORWARD_TO') ?? '',
      subject: `⭐ Neues Feedback von ${typedFeedback.user_name}`,
      html: generateEmailHTML(typedFeedback),
    };

    // Send email via Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error('Resend API error:', errorText);
      throw new Error(`Resend API error: ${resendResponse.statusText}`);
    }

    const resendData = await resendResponse.json();
    console.log('Email sent successfully:', resendData);

    // Mark email as sent in database
    const { error: updateError } = await supabaseClient
      .from('user_feedback')
      .update({
        email_sent: true,
        email_sent_at: new Date().toISOString(),
      })
      .eq('id', feedbackId);

    if (updateError) {
      console.error('Error updating email_sent status:', updateError);
      // Don't throw - email was sent successfully
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailId: resendData.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in send-feedback-email function:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Generate HTML email template with feedback data
 */
function generateEmailHTML(feedback: FeedbackData): string {
  // Filter out null/undefined ratings
  const ratings = [
    { label: 'Gesamt-Erlebnis', value: feedback.overall_rating },
    { label: 'Features & Tools', value: feedback.features_rating },
    { label: 'Trainingsplan-Editor', value: feedback.editor_rating },
    { label: 'Marktplatz', value: feedback.marketplace_rating },
  ].filter((r) => r.value);

  const ratingsHTML = ratings.length > 0
    ? `
      <div class="section">
        <h2 style="color: #1f2937; font-size: 18px; margin: 0 0 12px 0;">⭐ Bewertungen</h2>
        ${
      ratings
        .map(
          (r) => `
          <div class="rating">
            <strong>${r.label}:</strong>
            <span class="stars">${'⭐'.repeat(r.value!)}</span>
            <span style="color: #6b7280;">(${r.value}/5)</span>
          </div>
        `,
        )
        .join('')
    }
      </div>
    `
    : '';

  const individualFeedbackHTML = feedback.individual_feedback
    ? `
      <div class="section">
        <h2 style="color: #1f2937; font-size: 18px; margin: 0 0 12px 0;">💬 Individuelles Feedback</h2>
        <p style="white-space: pre-wrap; margin: 0; line-height: 1.6;">${
      feedback.individual_feedback.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    }</p>
      </div>
    `
    : '';

  const featureSuggestionHTML = feedback.feature_suggestion
    ? `
      <div class="section">
        <h2 style="color: #1f2937; font-size: 18px; margin: 0 0 12px 0;">💡 Feature-Vorschlag</h2>
        <p style="white-space: pre-wrap; margin: 0; line-height: 1.6;">${
      feedback.feature_suggestion.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    }</p>
      </div>
    `
    : '';

  const formattedDate = new Date(feedback.created_at).toLocaleString('de-DE', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  return `
<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        margin: 0;
        padding: 0;
        background-color: #f3f4f6;
      }
      .container {
        max-width: 600px;
        margin: 20px auto;
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      .header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 30px 20px;
        text-align: center;
      }
      .header h1 {
        margin: 0 0 12px 0;
        font-size: 24px;
        font-weight: 600;
      }
      .header p {
        margin: 4px 0;
        opacity: 0.95;
        font-size: 14px;
      }
      .content {
        padding: 24px;
      }
      .section {
        background: #f9fafb;
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 16px;
        border-left: 4px solid #667eea;
      }
      .section:last-child {
        margin-bottom: 0;
      }
      .rating {
        display: block;
        padding: 10px 0;
        border-bottom: 1px solid #e5e7eb;
      }
      .rating:last-child {
        border-bottom: none;
      }
      .stars {
        font-size: 18px;
        margin: 0 8px;
      }
      .footer {
        background: #f9fafb;
        padding: 20px;
        text-align: center;
        font-size: 12px;
        color: #6b7280;
        border-top: 1px solid #e5e7eb;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>⭐ Neues Feedback erhalten!</h1>
        <p><strong>Von:</strong> ${feedback.user_name}</p>
        <p><strong>Email:</strong> ${feedback.user_email}</p>
        <p><strong>Datum:</strong> ${formattedDate}</p>
      </div>

      <div class="content">
        ${ratingsHTML}
        ${individualFeedbackHTML}
        ${featureSuggestionHTML}
      </div>

      <div class="footer">
        <p>Diese E-Mail wurde automatisch vom zenit-it Feedback-System generiert.</p>
        <p>Feedback-ID: ${feedback.id}</p>
      </div>
    </div>
  </body>
</html>
  `;
}
