import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CombineRequest {
  fileName: string;
  totalChunks: number;
  userId: string;
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

    // Get request body
    const { fileName, totalChunks }: CombineRequest = await req.json();

    if (!fileName || !totalChunks) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Download and combine chunks
    const combinedChunks: Uint8Array[] = [];
    
    for (let i = 1; i <= totalChunks; i++) {
      const chunkName = `${user.id}/${fileName}.part${i}`;
      
      const { data: chunkData, error: downloadError } = await supabaseClient.storage
        .from('uploads')
        .download(chunkName);

      if (downloadError) {
        return new Response(
          JSON.stringify({ error: 'Failed to download chunk', details: downloadError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const arrayBuffer = await chunkData.arrayBuffer();
      combinedChunks.push(new Uint8Array(arrayBuffer));
    }

    // Combine all chunks into a single file
    const combinedFile = new Blob(combinedChunks);

    // Upload the combined file
    const { error: uploadError } = await supabaseClient.storage
      .from('uploads')
      .upload(`${user.id}/${fileName}`, combinedFile, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      return new Response(
        JSON.stringify({ error: 'Failed to upload combined file', details: uploadError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean up chunk files
    for (let i = 1; i <= totalChunks; i++) {
      const chunkName = `${user.id}/${fileName}.part${i}`;
      await supabaseClient.storage
        .from('uploads')
        .remove([chunkName]);
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'File chunks combined successfully',
        fileName,
        path: `${user.id}/${fileName}`
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