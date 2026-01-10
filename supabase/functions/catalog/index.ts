import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createSupabaseClient, getUserRatings } from "../_shared/client.ts";
import { fetchTMDB } from "../_shared/tmdb.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    let page, type, minYear, maxYear;

    // Try parsing from body first
    try {
        const body = await req.json();
        page = body.page;
        type = body.type;
        minYear = body.min_year;
        maxYear = body.max_year;
    } catch {
        const url = new URL(req.url);
        page = url.searchParams.get('page');
        type = url.searchParams.get('type');
        minYear = url.searchParams.get('min_year');
        maxYear = url.searchParams.get('max_year');
    }

    page = page ?? '1';
    type = type ?? 'all'; // Default to all if not specified
    const min = minYear;
    const max = maxYear;

    const supabase = createSupabaseClient(req);
    const ratings = await getUserRatings(supabase);
    const userHistory = new Map(ratings.map(r => [r.title, r.score]));

    async function fetchItems(mediaType: 'movie' | 'tv') {
        const params: Record<string, string | number> = {
            page,
            language: 'es-ES',
            sort_by: 'popularity.desc',
            include_adult: 'false',
            'vote_count.gte': 100 
        };

        if (mediaType === 'movie') {
            if (min) params['primary_release_date.gte'] = `${min}-01-01`;
            if (max) params['primary_release_date.lte'] = `${max}-12-31`;
        } else {
            if (min) params['first_air_date.gte'] = `${min}-01-01`;
            if (max) params['first_air_date.lte'] = `${max}-12-31`;
        }

        const endpoint = `/discover/${mediaType}`;
        const res = await fetchTMDB(endpoint, params);
        return (res?.results || []).map((m: any) => ({ ...m, media_type: mediaType }));
    }

    let items = [];
    if (type === 'all') {
        const [movies, tv] = await Promise.all([fetchItems('movie'), fetchItems('tv')]);
        // Combine and sort by popularity
        items = [...movies, ...tv].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    } else {
        items = await fetchItems(type as 'movie' | 'tv');
    }

    const out = [];
    for (const m of items) {
        const title = (m.title || m.name || '').trim();
        if (!title) continue;

        const seen = userHistory.has(title);
        const my_score = userHistory.get(title) ?? 0;

        out.push({
            id: m.id,
            title,
            media_type: m.media_type, 
            overview: m.overview,
            poster_path: m.poster_path,
            release_date: m.release_date || m.first_air_date,
            vote_average: m.vote_average,
            popularity: m.popularity,
            status: seen ? 'seen' : 'new',
            my_score
        });
    }

    return new Response(JSON.stringify(out), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
     console.error("Catalog error:", error);
     return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
     });
  }
});
