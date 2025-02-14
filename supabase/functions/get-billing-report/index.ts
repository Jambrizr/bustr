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

    // Get query parameters
    const url = new URL(req.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    // Get billing report
    const { data: report, error: reportError } = await supabaseClient.rpc(
      'get_billing_report',
      {
        p_user_id: user.id,
        p_start_date: startDate,
        p_end_date: endDate,
      }
    );

    if (reportError) {
      return new Response(
        JSON.stringify({ error: 'Failed to get billing report', details: reportError }),
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

    // Return report and current metrics
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
        history: report,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});