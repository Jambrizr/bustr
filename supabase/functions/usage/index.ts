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

    // Handle different HTTP methods
    switch (req.method) {
      case 'GET': {
        // Get query parameters
        const url = new URL(req.url);
        const startDate = url.searchParams.get('startDate');
        const endDate = url.searchParams.get('endDate');

        // Get usage summary
        const { data: summary, error: summaryError } = await supabaseClient.rpc(
          'get_usage_summary',
          {
            p_user_id: user.id,
            p_start_date: startDate,
            p_end_date: endDate,
          }
        );

        if (summaryError) {
          return new Response(
            JSON.stringify({ error: 'Failed to get usage summary', details: summaryError }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get current billing cycle metrics
        const { data: currentMetrics, error: metricsError } = await supabaseClient
          .from('usage_metrics')
          .select(`
            total_rows_processed,
            total_data_processed_bytes,
            total_files_uploaded,
            total_cleaning_jobs,
            billing_cycles (
              start_date,
              end_date,
              plan_type
            )
          `)
          .eq('billing_cycles.user_id', user.id)
          .eq('billing_cycles.status', 'active')
          .single();

        if (metricsError) {
          return new Response(
            JSON.stringify({ error: 'Failed to get current metrics', details: metricsError }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            current: {
              cycleStart: currentMetrics.billing_cycles.start_date,
              cycleEnd: currentMetrics.billing_cycles.end_date,
              planType: currentMetrics.billing_cycles.plan_type,
              metrics: {
                rowsProcessed: currentMetrics.total_rows_processed,
                dataProcessedMB: Math.round(currentMetrics.total_data_processed_bytes / (1024 * 1024) * 100) / 100,
                filesUploaded: currentMetrics.total_files_uploaded,
                cleaningJobs: currentMetrics.total_cleaning_jobs,
              },
            },
            summary,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'POST': {
        // Track usage
        const { fileId, actionType, dataProcessed, metadata } = await req.json();

        if (!actionType) {
          return new Response(
            JSON.stringify({ error: 'Missing action type' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: logId, error: trackError } = await supabaseClient.rpc(
          'track_usage',
          {
            p_user_id: user.id,
            p_file_id: fileId,
            p_action_type: actionType,
            p_data_processed: dataProcessed || 0,
            p_metadata: metadata || {},
          }
        );

        if (trackError) {
          return new Response(
            JSON.stringify({ error: 'Failed to track usage', details: trackError }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Usage tracked successfully',
            logId,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});