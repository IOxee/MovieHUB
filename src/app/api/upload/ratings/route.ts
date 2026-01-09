import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import fs from 'fs/promises';
import path from 'path';
import { parse } from 'csv-parse/sync';

const allowed = new Set([-5, -2, 2, 5]);

type CsvRow = {
  title?: string;
  score?: string | number;
  tmdb_id?: string | number;
  media_type?: string;
};

type RatingPayload = {
  user_id: string;
  tmdb_id: number;
  title: string;
  media_type: 'movie' | 'tv';
  score: number;
};

function parseCsv(content: string): CsvRow[] {
  return parse(content, { columns: true, skip_empty_lines: true, trim: true }) as CsvRow[];
}

export async function POST() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const filePath = path.join(process.cwd(), 'data', 'user_ratings_db.csv');
  let content: string;
  try {
    content = await fs.readFile(filePath, 'utf8');
  } catch {
    return NextResponse.json({ error: 'CSV not found', path: filePath }, { status: 404 });
  }

  const rows = parseCsv(content);
  const payload: RatingPayload[] = [];
  for (const row of rows) {
    const title = (row.title || '').trim();
    const score = Number(row.score);
    const tmdbId = Number(row.tmdb_id);
    const mediaType = (row.media_type || 'movie').trim();
    if (!title) continue;
    if (!allowed.has(score)) continue;
    payload.push({
      user_id: user.id,
      tmdb_id: Number.isFinite(tmdbId) ? tmdbId : 0,
      title,
      media_type: mediaType === 'tv' ? 'tv' : 'movie',
      score
    });
  }

  let upserted = 0;
  for (let i = 0; i < payload.length; i += 500) {
    const batch = payload.slice(i, i + 500);
    const { error } = await supabase.from('user_ratings').upsert(batch, { onConflict: 'user_id,tmdb_id' });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    upserted += batch.length;
  }

  return NextResponse.json({ processed: payload.length, upserted });
}
