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

    // Get job ID from URL
    const url = new URL(req.url);
    const jobId = url.searchParams.get('jobId');

    if (!jobId) {
      return new Response(
        JSON.stringify({ error: 'Missing job ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get job and file details
    const { data: job, error: jobError } = await supabaseClient
      .from('cleaning_jobs')
      .select(`
        *,
        files (
          id,
          file_path,
          original_name
        )
      `)
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (jobError || !job) {
      return new Response(
        JSON.stringify({ error: 'Job not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if job is completed
    if (job.status !== 'completed') {
      return new Response(
        JSON.stringify({ error: 'Job is not completed yet' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get original file data
    const { data: originalFile } = await supabaseClient.storage
      .from('uploads')
      .download(job.files.file_path);

    // Get cleaned file data
    const cleanedFilePath = `${job.files.file_path}.cleaned`;
    const { data: cleanedFile } = await supabaseClient.storage
      .from('uploads')
      .download(cleanedFilePath);

    // Parse and return both original and cleaned data
    const originalData = await originalFile.text();
    const cleanedData = await cleanedFile.text();

    // Log the data access
    await supabaseClient.rpc('add_audit_log', {
      p_user_id: user.id,
      p_action_type: 'file_downloaded',
      p_metadata: {
        job_id: job.id,
        file_id: job.files.id,
        type: 'cleaned_data',
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        job: {
          id: job.id,
          status: job.status,
          stats: job.results,
        },
        data: {
          original: originalData,
          cleaned: cleanedData,
        },
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