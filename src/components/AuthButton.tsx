"use client";
import { useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import Link from 'next/link';

type UserInfo = { id: string; email?: string } | null;

const generateUserTag = (email?: string) => {
  if (!email) return 'Guest';
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = Math.imul(31, hash) + email.charCodeAt(i) | 0;
  }
  return `${Math.abs(hash).toString(36).toUpperCase()}`;
};

export default function AuthButton() {
  const supabase = getSupabaseBrowser();
  const [user, setUser] = useState<UserInfo>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

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
    <div className="relative group" onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setIsOpen(false);
        }
    }}>
       <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 px-4 py-2 rounded-lg transition">
          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white">
            {user.email ? user.email[0].toUpperCase() : 'U'}
          </div>
          <span className="text-xs font-bold text-gray-300 hidden md:inline-block max-w-[100px] truncate">{generateUserTag(user.email)}</span>
          <i className="fas fa-chevron-down text-[10px] text-gray-500"></i>
       </button>
       
       <div className={`absolute right-0 top-full pt-2 w-48 z-50 animate-in fade-in slide-in-from-top-2 ${isOpen ? 'block' : 'hidden md:group-hover:block'}`}>
          <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-xl overflow-hidden">
            <div className="p-3 border-b border-gray-800">
              <p className="text-xs text-gray-500">Conectado como</p>
              <p className="text-sm font-bold text-white truncate">{generateUserTag(user.email)}</p>
            </div>
            <Link href="/profile" className="block px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition">
              <i className="fas fa-chart-pie mr-2 text-blue-500"></i> Mis Estadísticas
            </Link>
            <button onClick={signOut} className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 transition border-t border-gray-800">
              <i className="fas fa-sign-out-alt mr-2"></i> Cerrar Sesión
            </button>
          </div>
       </div>
    </div>
  );
}
