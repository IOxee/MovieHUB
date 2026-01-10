import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export function createSupabaseClient(req: Request) {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      global: {
        headers: { Authorization: req.headers.get("Authorization") ?? "" },
      },
    }
  );
}

export interface RatingRow {
  tmdb_id: number | null;
  title: string;
  media_type: string;
  score: number;
}

export async function getUserRatings(supabase: SupabaseClient): Promise<RatingRow[]> {
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

export async function getUserRatingsCount(supabase: SupabaseClient): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;
  
    const { count, error } = await supabase
      .from('user_ratings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
  
    if (error) throw error;
    return count || 0;
  }

export async function upsertUserRating(supabase: SupabaseClient, input: {
    id?: number | null;
    title: string;
    media_type: string;
    score: number;
  }) {
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
  
    const total = await getUserRatingsCount(supabase);
    return { total_ratings: total, storage: 'supabase' as const };
  }
