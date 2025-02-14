import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get webhook ID from URL
    const url = new URL(req.url);
    const webhookId = url.searchParams.get('id');

    if (!webhookId) {
      return new Response(
        JSON.stringify({ error: 'Missing webhook ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get webhook details
    const { data: webhook, error: webhookError } = await supabaseClient
      .from('crm_webhooks')
      .select(`
        *,
        crm_connections (
          id,
          user_id,
          provider,
          settings
        )
      `)
      .eq('id', webhookId)
      .single();

    if (webhookError || !webhook) {
      return new Response(
        JSON.stringify({ error: 'Invalid webhook' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify webhook secret
    const secret = req.headers.get('x-webhook-secret');
    if (secret !== webhook.secret_key) {
      return new Response(
        JSON.stringify({ error: 'Invalid webhook secret' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get contact data from request body
    const contactData = await req.json();

    // Create sync log
    const { data: syncLog, error: syncError } = await supabaseClient
      .from('crm_sync_logs')
      .insert({
        connection_id: webhook.crm_connections.id,
        sync_type: 'webhook',
        status: 'in_progress',
      })
      .select()
      .single();

    if (syncError) {
      return new Response(
        JSON.stringify({ error: 'Failed to create sync log' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      // Insert contact
      const { data: contact, error: contactError } = await supabaseClient
        .from('crm_contacts')
        .insert({
          connection_id: webhook.crm_connections.id,
          crm_contact_id: contactData.id,
          raw_data: contactData,
          status: 'new',
        })
        .select()
        .single();

      if (contactError) {
        throw contactError;
      }

      // Start cleaning job
      const { data: job, error: jobError } = await supabaseClient
        .from('cleaning_jobs')
        .insert({
          user_id: webhook.crm_connections.user_id,
          status: 'pending',
          settings: webhook.crm_connections.settings,
        })
        .select()
        .single();

      if (jobError) {
        throw jobError;
      }

      // Update contact with job ID
      await supabaseClient
        .from('crm_contacts')
        .update({ cleaning_job_id: job.id })
        .eq('id', contact.id);

      // Update sync log
      await supabaseClient
        .from('crm_sync_logs')
        .update({
          status: 'completed',
          contacts_processed: 1,
          contacts_cleaned: 1,
          completed_at: new Date().toISOString(),
        })
        .eq('id', syncLog.id);

      // Return success
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Contact received and cleaning job started',
          contactId: contact.id,
          jobId: job.id,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      // Update sync log with error
      await supabaseClient
        .from('crm_sync_logs')
        .update({
          status: 'failed',
          error_details: { error: error.message },
          completed_at: new Date().toISOString(),
        })
        .eq('id', syncLog.id);

      throw error;
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});