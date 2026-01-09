"use client";
import { useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import Link from 'next/link';

type UserInfo = { id: string; email?: string } | null;

export default function AuthButton() {
  const supabase = getSupabaseBrowser();
  const [user, setUser] = useState<UserInfo>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUser(data.user ? { id: data.user.id, email: data.user.email || undefined } : null);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    // Refresh to reflect server-side auth state
    if (typeof window !== 'undefined') window.location.reload();
  };

  if (loading) {
    return <div className="text-gray-400 text-sm">Cargando…</div>;
  }

  if (!user) {
    return (
      <Link href="/login" className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-bold border border-white/20">
        Iniciar sesión
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-400">{user.email || 'Usuario'}</span>
      <button onClick={signOut} className="bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded-lg text-sm font-bold border border-red-700">
        Salir
      </button>
    </div>
  );
}
