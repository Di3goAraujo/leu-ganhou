'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (!data.session) {
        router.replace('/login');
      } else {
        setReady(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, [router]);

  if (!ready) {
    return <div className="center-shell"><div className="glass-card"><p className="subtitle">Carregando...</p></div></div>;
  }

  return <>{children}</>;
}
