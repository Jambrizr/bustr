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
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user from auth header
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid user' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get request body
    const { connectionId } = await req.json();

    if (!connectionId) {
      return new Response(
        JSON.stringify({ error: 'Missing connection ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get connection details
    const { data: connection, error: connectionError } = await supabaseClient
      .from('crm_connections')
      .select('*')
      .eq('id', connectionId)
      .eq('user_id', user.id)
      .single();

    if (connectionError || !connection) {
      return new Response(
        JSON.stringify({ error: 'Invalid connection' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create sync log
    const { data: syncLog, error: syncError } = await supabaseClient
      .from('crm_sync_logs')
      .insert({
        connection_id: connectionId,
        sync_type: 'manual',
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

    // Start sync process
    // Note: In a real implementation, this would call the respective CRM's API
    // For now, we'll simulate a successful sync
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update sync log
      await supabaseClient
        .from('crm_sync_logs')
        .update({
          status: 'completed',
          contacts_processed: 10,
          contacts_cleaned: 8,
          contacts_failed: 2,
          completed_at: new Date().toISOString(),
        })
        .eq('id', syncLog.id);

      // Update connection last sync time
      await supabaseClient
        .from('crm_connections')
        .update({
          last_sync_at: new Date().toISOString(),
        })
        .eq('id', connectionId);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Sync completed successfully',
          syncId: syncLog.id,
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