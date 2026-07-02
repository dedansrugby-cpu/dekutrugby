import Link from 'next/link';
import { ReactNode } from 'react';

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-red-600/40 bg-zinc-950/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-semibold tracking-[0.2em] text-red-500">
            DEDAN MARSHALLS
          </Link>
          <nav className="flex gap-4 text-sm font-medium text-zinc-300">
            <Link href="/" className="transition hover:text-red-400">Home</Link>
            <Link href="/team" className="transition hover:text-red-400">Team</Link>
            <Link href="/profile" className="transition hover:text-red-400">Profile</Link>
            <Link href="/login" className="transition hover:text-red-400">Login</Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-red-600/30 bg-zinc-950 px-6 py-6 text-sm text-zinc-500">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Dedan Marshalls Rugby Club</p>
          <p>Powered by Next.js, Supabase, and Cloudinary</p>
        </div>
      </footer>
    </div>
  );
}
