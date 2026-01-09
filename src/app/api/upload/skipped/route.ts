import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import fs from 'fs/promises';
import path from 'path';
import { parse } from 'csv-parse/sync';

function parseCsv(content: string) {
  return parse(content, { columns: true, skip_empty_lines: true, trim: true });
}

export async function POST() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const filePath = path.join(process.cwd(), 'data', 'skipped_movies.csv');
  let content: string;
  try {
    content = await fs.readFile(filePath, 'utf8');
  } catch {
    return NextResponse.json({ error: 'CSV not found', path: filePath }, { status: 404 });
  }

  const rows = parseCsv(content);
  const titles = new Set<string>();
  for (const row of rows) {
    const title = (row.title || row.movie_title || '').trim();
    if (title) titles.add(title);
  }
  const payload = Array.from(titles).map((title) => ({ user_id: user.id, title }));

  let upserted = 0;
  for (let i = 0; i < payload.length; i += 500) {
    const batch = payload.slice(i, i + 500);
    const { error } = await supabase.from('skipped_titles').upsert(batch, { onConflict: 'user_id,title' });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    upserted += batch.length;
  }

  return NextResponse.json({ processed: payload.length, upserted });
}
