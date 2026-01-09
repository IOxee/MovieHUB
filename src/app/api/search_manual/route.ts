import { NextResponse } from 'next/server';
import { getUserRatingsServer } from '@/lib/ratings';
import { fetchTMDB } from '@/lib/tmdb';

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

export async function GET(req: Request) {
  const url = new URL(req.url);

  const query =
    (url.searchParams.get('q') ?? url.searchParams.get('query') ?? '').trim();

  const typeParam = (url.searchParams.get('type') ?? 'all').trim();
  const typeFilter = typeParam === 'movie' || typeParam === 'tv' ? typeParam : 'all';

  const limitRaw = Number(url.searchParams.get('limit') ?? 12);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 12;

  if (!query) return NextResponse.json([]);

  const ratings = await getUserRatingsServer();
  const userHistory = new Map(ratings.map(r => [r.title, r.score]));

  const res = await fetchTMDB(
    '/search/multi',
    { query, language: 'es-ES', include_adult: 'false', page: 1 },
    { revalidate: 0 }
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

  return NextResponse.json(out.slice(0, limit));
}
