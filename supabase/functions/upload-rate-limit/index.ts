import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RateLimitData {
  count: number;
  timestamp: number;
}

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

    // Get current rate limit data from KV store
    const rateLimitKey = `upload_rate_limit:${user.id}`;
    const { data: rateLimitData } = await supabaseClient
      .from('rate_limits')
      .select('*')
      .eq('key', rateLimitKey)
      .single();

    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const maxUploads = 5; // 5 uploads per minute

    let currentData: RateLimitData;

    if (!rateLimitData || (now - rateLimitData.timestamp) > windowMs) {
      // Reset rate limit if window has expired
      currentData = { count: 1, timestamp: now };
    } else {
      currentData = {
        count: rateLimitData.count + 1,
        timestamp: rateLimitData.timestamp,
      };
    }

    // Check if rate limit exceeded
    if (currentData.count > maxUploads) {
      const resetTime = new Date(currentData.timestamp + windowMs).toISOString();
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          resetTime,
          message: 'You can only upload 5 files per minute'
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update rate limit data
    await supabaseClient
      .from('rate_limits')
      .upsert({ 
        key: rateLimitKey,
        count: currentData.count,
        timestamp: currentData.timestamp
      });

    // Return success response with remaining uploads
    return new Response(
      JSON.stringify({
        success: true,
        remaining: maxUploads - currentData.count,
        resetTime: new Date(currentData.timestamp + windowMs).toISOString()
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