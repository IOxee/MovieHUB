import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createSupabaseClient, getUserRatings } from "../_shared/client.ts";
import { fetchTMDB } from "../_shared/tmdb.ts";

interface RecommendedItem {
  id: number;
  title: string;
  score: number;
  type: string;
  media_type: string;
  poster_path: string;
  overview: string;
  release_date?: string;
  vote_average: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
      const supabase = createSupabaseClient(req);
      const ratings = await getUserRatings(supabase);
      if (ratings.length === 0) {
        return new Response(JSON.stringify([]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      
      const seenTitles = new Set(ratings.map(r => r.title));
      const favorites = ratings.filter(r => r.score >= 2).sort((a, b) => b.score - a.score);
      
      if (favorites.length === 0) {
        return new Response(JSON.stringify([]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    
      const seeds = favorites.sort(() => 0.5 - Math.random()).slice(0, 6);
      const recommendations: RecommendedItem[] = [];
      
      for (const seed of seeds) {
        if (!seed.tmdb_id || seed.tmdb_id === 0) continue;
        
        const endpoint = `/${seed.media_type}/${seed.tmdb_id}/recommendations`;
        const res = await fetchTMDB(endpoint, { language: 'es-ES' });
        
        if (res?.results) {
          for (const item of res.results) {
            const title = item.title || item.name;
            const alreadyInRecs = recommendations.some(r => r.title === title);
            
            if (!seenTitles.has(title) && !alreadyInRecs) {
              let score = Math.floor((item.vote_average || 0) * 10);
              if (seed.score === 5) score += 10;
              
              recommendations.push({
                 id: item.id,
                 title,
                 score: Math.min(score, 99),
                 type: `Por ${seed.title}`,
                 media_type: seed.media_type,
                 poster_path: item.poster_path,
                 overview: item.overview,
                 release_date: item.release_date || item.first_air_date,
                 vote_average: item.vote_average || 0
              } as RecommendedItem);
            }
          }
        }
      }
    
      recommendations.sort((a, b) => b.score - a.score);
      
      return new Response(JSON.stringify(recommendations.slice(0, 12)), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
  } catch (error) {
     return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
     });
  }
});
