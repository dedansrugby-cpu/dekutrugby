import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const latestResults = [
  { date: 'Jun 28', opponent: 'Kisumu RFC', result: 'Won 24-14', status: 'Finished' },
  { date: 'Jun 21', opponent: 'Nairobi University', result: 'Lost 12-19', status: 'Finished' },
  { date: 'Jun 14', opponent: 'Mombasa Sharks', result: 'Won 31-10', status: 'Finished' },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-white">
      <Navbar />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-red-600/30 bg-zinc-950">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,0,0,0.25),_transparent_45%)]" />
          <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-28">
            <div className="max-w-2xl">
              <p className="mb-4 text-sm uppercase tracking-[0.4em] text-red-500">Dedan Marshalls Rugby</p>
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
                Unyielding strength. Relentless team spirit.
              </h1>
              <p className="mt-6 text-lg leading-8 text-zinc-400">
                A modern rugby club website showcasing the squad, live results, and a secure player portal built with Supabase and Cloudinary.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/team" className="rounded-full bg-red-600 px-6 py-3 font-semibold transition hover:bg-red-700">
                  View roster
                </Link>
                <Link href="/login" className="rounded-full border border-red-600/40 px-6 py-3 font-semibold transition hover:border-red-500 hover:text-red-400">
                  Player login
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-red-600/30 bg-zinc-900/80 p-8 shadow-2xl shadow-red-950/20">
              <p className="mb-4 text-sm uppercase tracking-[0.3em] text-red-500">Match day</p>
              <h2 className="text-3xl font-semibold">Next fixture</h2>
              <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
                <p className="text-sm text-zinc-400">Saturday • 4:00 PM</p>
                <p className="mt-2 text-2xl font-semibold">Dedan Marshalls vs. Eldoret Titans</p>
                <p className="mt-3 text-sm text-red-400">Venue: Dedan Kimathi Grounds</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-3xl border border-red-600/30 bg-zinc-900/80 p-8">
              <p className="mb-3 text-sm uppercase tracking-[0.3em] text-red-500">Latest results</p>
              <h3 className="text-2xl font-semibold">Recent form</h3>
              <div className="mt-6 space-y-4">
                {latestResults.map((item) => (
                  <div key={item.date} className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{item.date}</p>
                      <span className="rounded-full bg-red-600/15 px-3 py-1 text-sm text-red-400">{item.status}</span>
                    </div>
                    <p className="mt-2 text-zinc-300">{item.opponent}</p>
                    <p className="mt-1 text-lg font-semibold">{item.result}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-red-600/30 bg-gradient-to-br from-red-600/20 to-zinc-900/80 p-8">
              <p className="mb-3 text-sm uppercase tracking-[0.3em] text-red-500">Team focus</p>
              <h3 className="text-2xl font-semibold">Built for performance</h3>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-300">
                The site combines a public-facing team story with a secure dashboard for players, making it easy to share the squad and keep profile data up to date.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
                  <p className="text-sm uppercase tracking-[0.3em] text-red-400">Supabase</p>
                  <p className="mt-2 text-zinc-300">Auth and roster data live in one connected backend.</p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
                  <p className="text-sm uppercase tracking-[0.3em] text-red-400">Cloudinary</p>
                  <p className="mt-2 text-zinc-300">Player photos upload directly from the dashboard into cloud storage.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
