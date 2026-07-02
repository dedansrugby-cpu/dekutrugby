'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setAuthed(true);
      } else {
        router.replace('/login');
      }
      setReady(true);
    };

    checkSession();
  }, [router]);

  if (!ready) {
    return <p className="text-sm text-zinc-400">Checking access...</p>;
  }

  if (!authed) {
    return null;
  }

  return <>{children}</>;
}
