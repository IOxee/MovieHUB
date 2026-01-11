import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
      let media_id, media_type, region, lang;
      
      try {
          const body = await req.json();
          media_id = body.media_id || body.id;
          media_type = body.media_type || body.type;
          region = body.region || body.country;
          lang = body.lang;
      } catch {
          const url = new URL(req.url);
          media_id = url.searchParams.get('media_id') || url.searchParams.get('id');
          media_type = url.searchParams.get('media_type') || url.searchParams.get('type');
          region = url.searchParams.get('region') || url.searchParams.get('country');
          lang = url.searchParams.get('lang');
      }

      media_id = media_id || '1';
      media_type = media_type || 'movie';

      // Region fallback
      if (!region) {
        region = req.headers.get('cf-ipcountry');
      }
      if (!region) {
        region = 'ES';
      }
      region = region.toUpperCase();

      // Lang fallback
      lang = lang || 'es';

      const TMDB_BASE_URL = Deno.env.get('TMDB_BASE_URL') || 'https://api.themoviedb.org/3';
      const TMDB_API_KEY = Deno.env.get('TMDB_API_KEY');
    
      if (!TMDB_API_KEY) {
        return new Response(JSON.stringify([]), { status: 200, headers: { ...corsHeaders, 'content-type': 'application/json' } });
      }
    
      const endpoint = `${TMDB_BASE_URL}/${media_type}/${media_id}/watch/providers?api_key=${encodeURIComponent(TMDB_API_KEY)}`;

      const res = await fetch(endpoint);
      if (!res.ok) {
           return new Response(JSON.stringify([]), { status: 200, headers: { ...corsHeaders, 'content-type': 'application/json' } });
      }
      const data = await res.json();
  
      const regionData = data.results?.[region] || {};
      const providers: Array<{ name: string; logo: string; type: string }> = [];
      const seenLogos = new Set<string>();
  
      const processProvider = (list: any[], typeLabel: string) => {
        if (!list) return;
        list.forEach(p => {
          if (!seenLogos.has(p.logo_path)) {
            providers.push({ name: p.provider_name, logo: p.logo_path, type: typeLabel });
            seenLogos.add(p.logo_path);
          }
        });
      };

      const labels: Record<string, { flatrate: string, free: string, ads: string, rent: string, buy: string }> = {
        es: { flatrate: 'Streaming', free: 'Gratis', ads: 'Anuncios', rent: 'Alquiler', buy: 'Compra' },
        en: { flatrate: 'Streaming', free: 'Free', ads: 'Ads', rent: 'Rent', buy: 'Buy' }
      };
      
      const currentLabels = labels[lang] || labels.es;
  
      processProvider(regionData.flatrate, currentLabels.flatrate);
      processProvider(regionData.free, currentLabels.free);
      processProvider(regionData.ads, currentLabels.ads);
      // Optional: Add rent/buy if desired, but user didn't ask explicitly. existing code had flatrate and free only.
      // I'll stick to flatrate and free to match existing behavior, maybe ads too as it is common.

  
      return new Response(JSON.stringify(providers), { status: 200, headers: { ...corsHeaders, 'content-type': 'application/json' } });

  } catch (error) {
    // If error, return empty list gracefully or error
    return new Response(JSON.stringify([]), { status: 200, headers: { ...corsHeaders, 'content-type': 'application/json' } });
  }
});
