'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(error.message);
    } else {
      router.push('/profile');
    }

    setLoading(false);
  };

  return (
    <main className="flex-1 bg-zinc-950 px-6 py-16 text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 rounded-3xl border border-red-600/30 bg-zinc-900/80 p-8 shadow-2xl shadow-red-950/20 md:flex-row">
        <div className="flex-1">
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-red-500">Player portal</p>
          <h1 className="text-4xl font-semibold">Sign in to manage your profile</h1>
          <p className="mt-4 text-zinc-400">Use your Supabase-authenticated player account to update your roster details and photo.</p>
        </div>

        <form onSubmit={handleLogin} className="flex-1 space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none ring-0"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none ring-0"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-red-600 px-4 py-3 font-semibold transition hover:bg-red-700"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
          {message ? <p className="text-sm text-red-400">{message}</p> : null}
        </form>
      </div>
    </main>
  );
}
