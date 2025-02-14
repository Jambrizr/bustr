import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChunkMetadata {
  fileName: string;
  chunkNumber: number;
  totalChunks: number;
  fileSize: number;
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

    // Get chunk metadata from request
    const formData = await req.formData();
    const chunkBlob = formData.get('chunk') as Blob;
    const metadata: ChunkMetadata = JSON.parse(formData.get('metadata') as string);

    if (!chunkBlob || !metadata) {
      return new Response(
        JSON.stringify({ error: 'Missing chunk data or metadata' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate chunk size (20MB limit)
    const MAX_CHUNK_SIZE = 20 * 1024 * 1024; // 20MB in bytes
    if (chunkBlob.size > MAX_CHUNK_SIZE) {
      return new Response(
        JSON.stringify({ 
          error: 'Chunk size exceeds limit',
          message: 'Maximum chunk size is 20MB'
        }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique chunk name
    const chunkName = `${user.id}/${metadata.fileName}.part${metadata.chunkNumber}`;

    // Upload chunk to storage
    const { error: uploadError } = await supabaseClient.storage
      .from('uploads')
      .upload(chunkName, chunkBlob, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      return new Response(
        JSON.stringify({ error: 'Failed to upload chunk', details: uploadError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If this was the last chunk, trigger chunk combination
    if (metadata.chunkNumber === metadata.totalChunks) {
      // Call the combine-chunks function
      const combineResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/combine-chunks`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader,
          },
          body: JSON.stringify({
            fileName: metadata.fileName,
            totalChunks: metadata.totalChunks,
            userId: user.id,
          }),
        }
      );

      if (!combineResponse.ok) {
        const error = await combineResponse.json();
        return new Response(
          JSON.stringify({ error: 'Failed to combine chunks', details: error }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const combineResult = await combineResponse.json();
      return new Response(
        JSON.stringify({
          success: true,
          message: 'File uploaded and combined successfully',
          ...combineResult
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return success for intermediate chunks
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Chunk uploaded successfully',
        chunkNumber: metadata.chunkNumber,
        totalChunks: metadata.totalChunks
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