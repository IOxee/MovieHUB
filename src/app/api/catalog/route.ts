import { NextResponse } from 'next/server';
import { getUserRatingsServer } from '@/lib/ratings';
import { fetchTMDB } from '@/lib/tmdb';

interface TMDBItem {
  id: number;
  title?: string;
  name?: string;
  poster_path: string;
  overview: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  media_type?: string;
  popularity?: number;
}

export async function GET() {
  const min_year = '1970';
  const max_year = new Date().getFullYear().toString();
  const media_type = 'all';
  const page = '1';

  // Get User History
  const ratings = await getUserRatingsServer();
  const userHistory = new Map(ratings.map(r => [r.title, r.score]));

  const typesToFetch = media_type === 'all' ? ['movie', 'tv'] : [media_type];
  let rawResults: TMDBItem[] = [];

  for (const mType of typesToFetch) {
    const params: Record<string, string | number> = {
      language: 'es-ES',
      sort_by: 'popularity.desc',
      include_adult: 'false',
      'vote_count.gte': 50,
      page: page
    };

    if (mType === 'movie') {
      params['primary_release_date.gte'] = `${min_year}-01-01`;
      params['primary_release_date.lte'] = `${max_year}-12-31`;
      const res = await fetchTMDB('/discover/movie', params);
      if (res?.results) {
        res.results.forEach((item: TMDBItem) => {
            item.media_type = 'movie'; 
            rawResults.push(item);
        });
      }
    } else {
      params['first_air_date.gte'] = `${min_year}-01-01`;
      params['first_air_date.lte'] = `${max_year}-12-31`;
      const res = await fetchTMDB('/discover/tv', params);
      if (res?.results) {
        res.results.forEach((item: TMDBItem) => {
            item.media_type = 'tv';
            rawResults.push(item);
        });
      }
    }
  }

  if (media_type === 'all') {
    rawResults.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    rawResults = rawResults.slice(0, 20);
  }

  const results = rawResults
    .filter(item => item.poster_path)
    .map(item => {
      const title = (item.title || item.name) as string;
      const status = userHistory.has(title) ? 'seen' : 'new';
      const my_score = userHistory.get(title) || 0;

      return {
        id: item.id,
        title: title,
        media_type: item.media_type,
        poster_path: item.poster_path,
        overview: item.overview,
        release_date: item.release_date || item.first_air_date || 'N/A',
        vote_average: item.vote_average || 0,
        status,
        my_score
      };
    });

  return NextResponse.json(results);
}
