'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <button className="btn btn-soft" onClick={logout}>
      Sair
    </button>
  );
}
