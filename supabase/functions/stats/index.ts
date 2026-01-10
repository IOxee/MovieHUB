import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createSupabaseClient, getUserRatingsCount } from "../_shared/client.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
      const supabase = createSupabaseClient(req);
      const count = await getUserRatingsCount(supabase);
      return new Response(JSON.stringify({ count }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
  } catch (error) {
     return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
     });
  }
});
