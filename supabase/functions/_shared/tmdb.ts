
export async function fetchTMDB(
  endpoint: string,
  params: Record<string, string | number>,
) {
  const TMDB_BASE_URL = Deno.env.get("TMDB_BASE_URL") ?? "https://api.themoviedb.org/3";
  const TMDB_API_KEY = Deno.env.get("TMDB_API_KEY");

  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  if (TMDB_API_KEY) {
    url.searchParams.append("api_key", TMDB_API_KEY);
  }

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.append(key, String(value));
  }

  try {
    const res = await fetch(url.toString(), {
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
        console.error(`TMDB error: ${res.status} ${res.statusText}`);
        return null;
    }
    return await res.json();
  } catch (err) {
    console.error("TMDB fetch error:", err);
    return null;
  }
}
