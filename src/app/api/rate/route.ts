import { NextRequest, NextResponse } from 'next/server';
import { upsertUserRatingServer } from '@/lib/ratings';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { title, media_type = 'movie', rating_type, id } = data;

    const scoreMap: Record<string, number> = {
      MegaDislike: -5,
      Dislike: -2,
      Like: 2,
      SuperLike: 5
    };

    const score = scoreMap[rating_type];
    if (!title || !media_type || score === undefined) {
      return NextResponse.json(
        { status: 'error', total_ratings: 0, message: 'Invalid payload' },
        { status: 400 }
      );
    }

    const numericId = typeof id === 'number' ? id : Number(id);
    const tmdbId = Number.isFinite(numericId) && numericId > 0 ? numericId : null;

    const { total_ratings, storage } = await upsertUserRatingServer({
      id: tmdbId,
      title,
      media_type,
      score
    });

    return NextResponse.json({ status: 'success', total_ratings, storage });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Not authenticated' ? 401 : 500;
    if (status === 500) console.error(error);
    return NextResponse.json({ status: 'error', total_ratings: 0, message }, { status });
  }
}
