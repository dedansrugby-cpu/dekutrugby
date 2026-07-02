'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CldUploadWidget } from 'next-cloudinary';
import { supabase } from '@/lib/supabaseClient';
import { AuthGuard } from '@/components/AuthGuard';

export default function ProfilePage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('');
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }

      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setFullName(data.full_name || '');
        setPosition(data.position || '');
        setJerseyNumber(data.jersey_number?.toString() || '');
        setBio(data.bio || '');
        setAvatarUrl(data.avatar_url || '');
      }
    };

    loadProfile();
  }, [router]);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessage('You must be logged in.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: fullName,
      position,
      jersey_number: Number(jerseyNumber),
      bio,
      avatar_url: avatarUrl,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Profile updated successfully.');
    }

    setLoading(false);
  };

  return (
    <AuthGuard>
      <main className="flex-1 bg-zinc-950 px-6 py-16 text-white">
        <div className="mx-auto max-w-5xl rounded-3xl border border-red-600/30 bg-zinc-900/80 p-8 shadow-2xl shadow-red-950/20">
          <div className="mb-8">
            <p className="mb-3 text-sm uppercase tracking-[0.3em] text-red-500">Player dashboard</p>
            <h1 className="text-4xl font-semibold">Edit your profile</h1>
            <p className="mt-3 text-zinc-400">Keep your public roster information fresh and add a profile photo through Cloudinary.</p>
          </div>

          <form onSubmit={saveProfile} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" placeholder="Full name" required />
              <input value={position} onChange={(e) => setPosition(e.target.value)} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" placeholder="Position" required />
              <input value={jerseyNumber} onChange={(e) => setJerseyNumber(e.target.value)} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" placeholder="Jersey number" type="number" required />
              <input value={bio} onChange={(e) => setBio(e.target.value)} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" placeholder="Short bio" />
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
              <p className="mb-3 font-medium text-zinc-200">Profile photo</p>
              <CldUploadWidget
                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'dekutrugby'}
                onSuccess={(result: any) => {
                  const publicUrl = result?.info?.secure_url;
                  if (publicUrl) {
                    setAvatarUrl(publicUrl);
                    setMessage('Photo uploaded successfully.');
                  }
                }}
              >
                {({ open }) => (
                  <button type="button" onClick={() => open()} className="rounded-xl bg-red-600 px-4 py-3 font-semibold transition hover:bg-red-700">
                    Upload photo
                  </button>
                )}
              </CldUploadWidget>
              {avatarUrl ? <p className="mt-3 text-sm text-green-400">Image ready to save.</p> : null}
            </div>

            <button type="submit" disabled={loading} className="rounded-xl bg-white px-4 py-3 font-semibold text-zinc-950 transition hover:bg-zinc-200">
              {loading ? 'Saving...' : 'Save profile'}
            </button>
            {message ? <p className="text-sm text-red-400">{message}</p> : null}
          </form>
        </div>
      </main>
    </AuthGuard>
  );
}
