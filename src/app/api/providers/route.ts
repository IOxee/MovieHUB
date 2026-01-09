import { NextResponse } from 'next/server';
import { fetchTMDB } from '@/lib/tmdb';

interface ProviderItem {
  logo_path: string;
  provider_name: string;
}

export async function GET() {
  const media_id = '1';
  const media_type = 'movie';

  if (!media_id || !media_type) return NextResponse.json([]);

  const data = await fetchTMDB(`/${media_type}/${media_id}/watch/providers`, {});
  if (!data) return NextResponse.json([]);

  const esData = data.results?.ES || {};
  const providers: Array<{ name: string; logo: string; type: string }> = [];
  const seenLogos = new Set<string>();

  const processProvider = (list: ProviderItem[], typeLabel: string) => {
    if (!list) return;
    list.forEach(p => {
      if (!seenLogos.has(p.logo_path)) {
        providers.push({
            name: p.provider_name,
            logo: p.logo_path,
            type: typeLabel
        });
        seenLogos.add(p.logo_path);
      }
    });
  };

  processProvider(esData.flatrate, 'Streaming');
  processProvider(esData.free, 'Gratis');

  return NextResponse.json(providers);
}
