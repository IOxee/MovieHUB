import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createSupabaseClient, upsertUserRating } from "../_shared/client.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createSupabaseClient(req);
    const data = await req.json();
    const { title, media_type = 'movie', rating_type, id } = data;

    const scoreMap: Record<string, number> = {
      MegaDislike: -5,
      Dislike: -2,
      Like: 2,
      SuperLike: 5
    };

    const score = scoreMap[rating_type];
    if (!title || !media_type || score === undefined) {
      return new Response(JSON.stringify({ status: 'error', total_ratings: 0, message: 'Invalid payload' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    const numericId = typeof id === 'number' ? id : Number(id);
    const tmdbId = Number.isFinite(numericId) && numericId > 0 ? numericId : null;

    const { total_ratings, storage } = await upsertUserRating(supabase, {
      id: tmdbId,
      title,
      media_type,
      score
    });

    return new Response(JSON.stringify({ status: 'success', total_ratings, storage }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Not authenticated' ? 401 : 500;
    return new Response(JSON.stringify({ status: 'error', total_ratings: 0, message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status
    });
  }
});
