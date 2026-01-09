import { getSupabaseServer } from '@/lib/supabase/server';

export interface RatingRow {
  tmdb_id: number | null;
  title: string;
  media_type: string;
  score: number;
}

export async function getUserRatingsServer(): Promise<RatingRow[]> {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('user_ratings')
    .select('tmdb_id,title,media_type,score')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data || []) as RatingRow[];
}

export async function getUserRatingsCountServer(): Promise<number> {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from('user_ratings')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (error) throw error;
  return count || 0;
}

export async function upsertUserRatingServer(input: {
  id?: number | null;
  title: string;
  media_type: string;
  score: number;
}) {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const rawId = typeof input.id === 'number' ? input.id : null;
  const tmdbId = Number.isFinite(rawId) && (rawId as number) > 0 ? (rawId as number) : null;

  const onConflict = tmdbId ? 'user_id,tmdb_id' : 'user_id,title,media_type';

  const { error } = await supabase
    .from('user_ratings')
    .upsert(
      {
        user_id: user.id,
        tmdb_id: tmdbId,
        title: input.title,
        media_type: input.media_type,
        score: input.score
      },
      { onConflict }
    );

  if (error) throw error;

  const total = await getUserRatingsCountServer();
  return { total_ratings: total, storage: 'supabase' as const };
}
