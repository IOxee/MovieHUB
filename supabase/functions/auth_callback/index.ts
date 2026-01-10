import { serve } from 'https://deno.land/std@0.201.0/http/server.ts';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

serve(async (req: Request) => {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const origin = req.headers.get('origin') || url.origin;

  if (!code) {
    return Response.redirect(`${origin}/?error=no_code`, 302);
  }

  // Use the actual function env var names first; fall back to NEXT_PUBLIC if present
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || Deno.env.get('NEXT_PUBLIC_SUPABASE_URL');
  const SUPABASE_KEY =
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ||
    Deno.env.get('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY') ||
    Deno.env.get('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return Response.redirect(`${origin}/?error=missing_env`, 302);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    // exchangeCodeForSession may or may not be available in the runtime SDK; attempt with the current signature
    const authAny = (supabase as any).auth;
    if (authAny && typeof authAny.exchangeCodeForSession === 'function') {
      // recent SDKs expect an object: { code }
      const result = await authAny.exchangeCodeForSession({ code });
      const error = result?.error || (result?.data && result.data.error) || null;
      if (error) {
        const msg = typeof error === 'string' ? error : error.message || JSON.stringify(error);
        return Response.redirect(`${origin}/?error=${encodeURIComponent(msg)}`, 302);
      }
      return Response.redirect(`${origin}/`, 302);
    }

    // Fallback: call the REST token endpoint
    const tokenUrl = `${SUPABASE_URL.replace(/\/+$/, '')}/auth/v1/token`;
    const body = new URLSearchParams();
    body.set('grant_type', 'authorization_code');
    body.set('code', code);
    const resp = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: body.toString(),
    });

    if (!resp.ok) {
      let text: string;
      const contentType = resp.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          const json = await resp.json();
          text = JSON.stringify(json);
        } catch {
          text = await resp.text();
        }
      } else {
        text = await resp.text();
      }
      return Response.redirect(`${origin}/?error=${encodeURIComponent(text)}`, 302);
    }

    return Response.redirect(`${origin}/`, 302);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown_error';
    return Response.redirect(`${origin}/?error=${encodeURIComponent(message)}`, 302);
  }
});