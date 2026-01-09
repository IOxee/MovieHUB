import { NextResponse } from 'next/server';
import { getUserRatingsServer } from '@/lib/ratings';
import { fetchTMDB } from '@/lib/tmdb';

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

export async function GET() {
  const ratings = await getUserRatingsServer();
  if (ratings.length === 0) return NextResponse.json([]);
  
  const seenTitles = new Set(ratings.map(r => r.title));
  // Filter favorites (score >= 2)
  const favorites = ratings.filter(r => r.score >= 2).sort((a, b) => b.score - a.score);
  
  if (favorites.length === 0) return NextResponse.json([]);

  // Pick random seeds (max 6)
  const seeds = favorites.sort(() => 0.5 - Math.random()).slice(0, 6);
  
  const recommendations: RecommendedItem[] = [];
  
  for (const seed of seeds) {
    if (!seed.tmdb_id || seed.tmdb_id === 0) continue;
    
    // TMDB endpoint: /movie/{id}/recommendations or /tv/{id}/recommendations
    const endpoint = `/${seed.media_type}/${seed.tmdb_id}/recommendations`;
    const res = await fetchTMDB(endpoint, { language: 'es-ES' });
    
    if (res?.results) {
      for (const item of res.results) {
        const title = item.title || item.name;
        
        // Check duplication in seen or current recommendations
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

  // Sort by calculated score desc
  recommendations.sort((a, b) => b.score - a.score);
  
  return NextResponse.json(recommendations.slice(0, 12));
}
