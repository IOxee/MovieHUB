import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createSupabaseClient, getUserRatings } from "../_shared/client.ts";
import { fetchTMDB } from "../_shared/tmdb.ts";

interface SearchResult {
  id: number;
  title: string;
  media_type: 'movie' | 'tv';
  overview: string;
  poster_path: string;
  release_date: string;
  vote_average: number;
  status: string;
  my_score: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
      let query, typeParam, limitRaw;

      try {
        const body = await req.json();
        query = body.q || body.query;
        typeParam = body.type;
        limitRaw = body.limit;
      } catch {
        const url = new URL(req.url);
        query = url.searchParams.get('q') ?? url.searchParams.get('query');
        typeParam = url.searchParams.get('type');
        limitRaw = url.searchParams.get('limit');
      }

      query = (query ?? '').trim();
      typeParam = (typeParam ?? 'all').trim();
      const typeFilter = typeParam === 'movie' || typeParam === 'tv' ? typeParam : 'all';
      limitRaw = Number(limitRaw ?? 12);
      const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 12;
    
      if (!query) {
         return new Response(JSON.stringify([]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const supabase = createSupabaseClient(req);
      const ratings = await getUserRatings(supabase);
      const userHistory = new Map(ratings.map(r => [r.title, r.score]));
    
      const res = await fetchTMDB(
        '/search/multi',
        { query, language: 'es-ES', include_adult: 'false', page: 1 }
      );
    
      const out: SearchResult[] = [];
      const items = Array.isArray(res?.results) ? res.results : [];

      for (const m of items) {
        if (m?.media_type !== 'movie' && m?.media_type !== 'tv') continue;
        if (typeFilter !== 'all' && m.media_type !== typeFilter) continue;
        if (!m.poster_path) continue;
    
        const title = (m.title || m.name || '').trim();
        if (!title) continue;
    
        const status = userHistory.has(title) ? 'seen' : 'new';
        const my_score = userHistory.get(title) ?? 0;
    
        out.push({
          id: m.id,
          title,
          media_type: m.media_type,
          overview: m.overview || '',
          poster_path: m.poster_path,
          release_date: m.release_date || m.first_air_date || 'N/A',
          vote_average: m.vote_average || 0,
          status,
          my_score
        });
      }
    
      return new Response(JSON.stringify(out.slice(0, limit)), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
     return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
     });
  }
});
