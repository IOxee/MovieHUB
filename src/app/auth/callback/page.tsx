'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuth = async () => {
      const code = searchParams.get('code');
      const next = searchParams.get('next') ?? '/';
      
      if (code) {
        const supabase = getSupabaseBrowser();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (!error) {
          router.push(next);
        } else {
          setError(error.message);
          // Redirect to login after a delay or show error
          setTimeout(() => router.push('/login?error=auth_error'), 3000);
        }
      } else {
         // No code, redirect home
         router.push('/');
      }
    };

    handleAuth();
  }, [router, searchParams]);

  if (error) {
     return <div className="p-10 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-xl">
        <i className="fas fa-spinner fa-spin mr-2"></i>
        Authenticating...
      </div>
    </div>
  );
}
