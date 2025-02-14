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
        // Get deleted files list
        const { data: deletedFiles, error } = await supabaseClient
          .from('deleted_files')
          .select('*')
          .eq('user_id', user.id)
          .eq('restored', false)
          .gt('expires_at', new Date().toISOString())
          .order('deleted_at', { ascending: false });

        if (error) {
          return new Response(
            JSON.stringify({ error: 'Failed to fetch deleted files' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, deletedFiles }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'POST': {
        const { action, fileId, retentionDays } = await req.json();

        if (action === 'delete') {
          // Soft delete a file
          if (!fileId) {
            return new Response(
              JSON.stringify({ error: 'Missing file ID' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const { data, error } = await supabaseClient.rpc(
            'soft_delete_file',
            {
              p_file_id: fileId,
              p_user_id: user.id,
              p_retention_days: retentionDays || 90
            }
          );

          if (error) {
            return new Response(
              JSON.stringify({ error: 'Failed to delete file' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'File deleted successfully',
              deletedFileId: data 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );

        } else if (action === 'restore') {
          // Restore a deleted file
          if (!fileId) {
            return new Response(
              JSON.stringify({ error: 'Missing deleted file ID' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const { data, error } = await supabaseClient.rpc(
            'restore_deleted_file',
            {
              p_deleted_file_id: fileId,
              p_user_id: user.id
            }
          );

          if (error) {
            return new Response(
              JSON.stringify({ error: 'Failed to restore file' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'File restored successfully' 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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