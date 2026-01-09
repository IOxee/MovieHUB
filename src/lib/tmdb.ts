const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = process.env.TMDB_BASE_URL;

type FetchOptions = {
  revalidate?: number;
};

export async function fetchTMDB(
  endpoint: string,
  params: Record<string, string | number>,
  options: FetchOptions = {}
) {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.append('api_key', TMDB_API_KEY || '');

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, String(value));
  });

  const revalidate = options.revalidate ?? 3600;

  try {
    const res = await fetch(url.toString(), { next: { revalidate } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
