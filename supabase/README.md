Supabase Functions for MovieHub_NEXT

This folder contains Supabase Edge Functions used to replace Next.js API routes when deploying a static site (e.g. GitHub Pages).

Included functions:
- `auth_callback` — exchanges OAuth `code` for a Supabase session and redirects back to the site.
- `providers` — proxies TMDB "watch/providers" endpoint and returns a simplified JSON list.

Environment variables required (set these in Supabase Project -> Functions -> Configuration):
- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase URL (https://xxxx.supabase.co)
- `SUPABASE_SERVICE_ROLE_KEY` — service role key (for token exchange fallback)
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` — publishable key (optional)
- `TMDB_API_KEY` — The MovieDB API key
- `TMDB_BASE_URL` — optional, defaults to https://api.themoviedb.org/3

Deploying with the Supabase CLI:

1. Install the Supabase CLI: https://supabase.com/docs/guides/cli
2. Log in and target your project.
3. From this repository root run:

```bash
supabase functions deploy auth_callback --project-ref <your-project-ref>
supabase functions deploy providers --project-ref <your-project-ref>
```

Notes:
- The `auth_callback` function attempts to use the Supabase JS SDK method `auth.exchangeCodeForSession`. If your runtime or SDK version does not expose that method, the function falls back to calling the `/auth/v1/token` endpoint using the provided key.
- After deployment, update your frontend to call the functions endpoints (e.g., `https://<your-project>.functions.supabase.co/auth_callback`).
