import { supabase } from '@/lib/supabaseClient';

async function getProfiles() {
  const { data } = await supabase.from('profiles').select('*').order('jersey_number', { ascending: true });
  return data ?? [];
}

export default async function TeamPage() {
  const profiles = await getProfiles();

  return (
    <main className="flex-1 bg-zinc-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-red-500">Roster</p>
          <h1 className="text-4xl font-semibold">Meet the squad</h1>
          <p className="mt-3 max-w-2xl text-zinc-400">
            This public roster page pulls profile rows from Supabase and renders them in a clean, responsive grid.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {profiles.length > 0 ? (
            profiles.map((player: any) => (
              <article key={player.id} className="rounded-2xl border border-red-600/30 bg-zinc-900 p-6 shadow-lg shadow-red-950/20">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">{player.full_name}</h2>
                    <p className="text-sm text-red-400">#{player.jersey_number || '—'} • {player.position || 'Player'}</p>
                  </div>
                  <div className="rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-sm text-red-300">
                    {player.position || 'Player'}
                  </div>
                </div>
                <p className="text-sm leading-7 text-zinc-400">{player.bio || 'A dedicated member of the squad.'}</p>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-red-600/40 bg-zinc-900/70 p-8 text-zinc-400 md:col-span-2 xl:col-span-3">
              No player profiles have been added yet. Once Supabase is connected, they will appear here.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
