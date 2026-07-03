const fetch = global.fetch;
const projectUrl = process.env.SUPABASE_URL || 'https://ocyhnzyzahwlkxmngngy.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

if (!serviceRoleKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable.');
  console.error('Set SUPABASE_SERVICE_ROLE_KEY to your Supabase service_role key and rerun.');
  process.exit(1);
}

const players = [
  { full_name: 'Brian Otieno', username: 'brian.otieno', position: 'Fly-half', jersey_number: 10, bio: 'Leadership and game control.' },
  { full_name: 'Moses Wanjala', username: 'moses.wanjala', position: 'Prop', jersey_number: 3, bio: 'Power in the scrum.' },
  { full_name: 'Lilian Akinyi', username: 'lilian.akinyi', position: 'Center', jersey_number: 12, bio: 'Breakthrough runner.' },
  { full_name: 'Kevin Njoroge', username: 'kevin.njoroge', position: 'Hooker', jersey_number: 2, bio: 'Lineout specialist.' },
  { full_name: 'Davis Kibet', username: 'davis.kibet', position: 'Wing', jersey_number: 7, bio: 'Explosive pace.' },
  { full_name: 'Njeri Mugo', username: 'njeri.mugo', position: 'Fullback', jersey_number: 15, bio: 'Safe under the high ball.' }
];

const headers = {
  apikey: serviceRoleKey,
  Authorization: `Bearer ${serviceRoleKey}`,
  'Content-Type': 'application/json'
};

function makePassword(username) {
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `Dmrugby!${suffix}`;
}

async function getUserByEmail(email) {
  const response = await fetch(`${projectUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
    method: 'GET',
    headers
  });
  if (!response.ok) {
    return null;
  }
  const data = await response.json();
  if (Array.isArray(data)) return data[0] || null;
  return data;
}

async function createAuthUser(email, password) {
  const response = await fetch(`${projectUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, password, email_confirm: true })
  });
  const data = await response.json();
  return { status: response.status, data };
}

async function upsertProfile(profile) {
  const response = await fetch(`${projectUrl}/rest/v1/profiles`, {
    method: 'POST',
    headers: {
      ...headers,
      Prefer: 'resolution=merge-duplicates'
    },
    body: JSON.stringify(profile)
  });
  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

(async () => {
  const results = [];

  for (const player of players) {
    const email = `${player.username}@dedanrugby.club`;
    const password = makePassword(player.username);
    let user = null;
    let action = 'created';

    const authResult = await createAuthUser(email, password);
    if (authResult.status === 200 || authResult.status === 201) {
      user = authResult.data;
    } else {
      const message = JSON.stringify(authResult.data);
      if (message.toLowerCase().includes('already exists') || authResult.status === 409) {
        const existing = await getUserByEmail(email);
        if (existing) {
          user = existing;
          action = 'exists';
        } else {
          results.push({ username: player.username, email, error: 'Existing account detected but could not fetch user.' });
          continue;
        }
      } else {
        results.push({ username: player.username, email, error: `Auth create failed: ${message}` });
        continue;
      }
    }

    const profilePayload = {
      user_id: user.id,
      full_name: player.full_name,
      position: player.position,
      jersey_number: player.jersey_number,
      bio: player.bio,
      avatar_url: ''
    };

    const profileResult = await upsertProfile(profilePayload);
    if (!profileResult.ok) {
      results.push({ username: player.username, email, action, error: `Profile save failed: ${JSON.stringify(profileResult.data)}` });
      continue;
    }

    results.push({ username: player.username, email, password, action, profile: profileResult.data });
  }

  console.log(JSON.stringify(results, null, 2));
})();
