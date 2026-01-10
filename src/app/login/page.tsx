"use client";
import { useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import Link from 'next/link';

export default function LoginPage() {
  const supabase = getSupabaseBrowser();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signInWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF;
      const base = projectRef ? `https://${projectRef}.functions.supabase.co` : '';
      let redirectUrl = base ? `${base}/auth_callback` : `${window.location.origin}/api/auth/callback`;
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectUrl } });
      if (error) throw error;
      setSent(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Algo salió mal';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/5 rounded-xl p-6 border border-white/10">
        <h1 className="text-2xl font-semibold mb-4">Iniciar sesión</h1>
        {sent ? (
          <p className="text-green-400">Te hemos enviado un enlace mágico. Revisa tu email.</p>
        ) : (
          <form onSubmit={signInWithEmail} className="space-y-4">
            <input
              type="email"
              required
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md px-3 py-2 bg-white/10 border border-white/20 focus:outline-none"
            />
            <button disabled={loading} className="w-full rounded-md bg-blue-600 hover:bg-blue-700 transition px-3 py-2">
              {loading ? 'Enviando…' : 'Enviar enlace mágico'}
            </button>
          </form>
        )}
        {error && <p className="text-red-400 mt-3">{error}</p>}
        <div className="mt-6 text-sm">
          <Link href="/" className="underline">Continuar como invitado</Link>
        </div>
      </div>
    </div>
  );
}
