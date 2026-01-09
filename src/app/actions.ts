/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { getSupabaseServer } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

function csvToJSON(csv: string) {
  const lines = csv.split(/\r?\n/);
  const result = [];
  const headers = lines[0].split(',');

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue;
    const obj: any = {};
    const currentline = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
    
    headers.forEach((header, index) => {
      let val = currentline[index] || '';
      val = val.replace(/^"|"$/g, '').trim();
      obj[header.trim()] = val;
    });
    result.push(obj);
  }
  return result;
}

export async function uploadSkippedMovies(formData: FormData) {
  const file = formData.get('file') as File;
  if (!file) return { error: 'No file provided' };

  const text = await file.text();
  const data = csvToJSON(text);
  
  const supabase = await getSupabaseServer();
  
  const formattedData = data.map((row: any) => ({
    title: row.title || row.movie_title, 
    movie_title: row.movie_title || row.title 
  }));

  const { error } = await supabase
    .from('skipped_movies') 
    .upsert(formattedData, { onConflict: 'title' });

  if (error) return { error: error.message };
  revalidatePath('/admin-data');
  return { success: true };
}

export async function uploadUserRatings(formData: FormData) {
  const file = formData.get('file') as File;
  if (!file) return { error: 'No file provided' };

  const text = await file.text();
  const data = csvToJSON(text);
  
  const supabase = await getSupabaseServer();

  const formattedData = data.map((row: any) => ({
    user_id: row.user_id,
    title: row.title,
    score: parseInt(row.score),
    tmdb_id: parseInt(row.tmdb_id),
    media_type: row.media_type
  }));

  const { error } = await supabase
    .from('user_ratings')
    .upsert(formattedData, { onConflict: 'user_id, tmdb_id' }); 

  if (error) return { error: error.message };
  revalidatePath('/admin-data');
  return { success: true };
}

export async function exportDatabaseData() {
  const supabase = await getSupabaseServer();
  
  const { data: skippedData } = await supabase.from('skipped_movies').select('*');
  const { data: ratingsData } = await supabase.from('user_ratings').select('*');

  const skippedCSV = skippedData && skippedData.length > 0
    ? [
        Object.keys(skippedData[0]).join(','),
        ...skippedData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
      ].join('\n')
    : '';

  const ratingsCSV = ratingsData && ratingsData.length > 0
    ? [
        Object.keys(ratingsData[0]).join(','),
        ...ratingsData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
      ].join('\n')
    : '';

  return { skippedCSV, ratingsCSV };
}