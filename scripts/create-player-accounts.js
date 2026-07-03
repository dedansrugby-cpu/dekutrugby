const fs = require('fs');
const path = require('path');
const fetch = global.fetch || require('node-fetch');

const projectUrl = process.env.SUPABASE_URL || 'https://ocyhnzyzahwlkxmngngy.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLIC_ANON_KEY;
const loginFilePath = path.resolve(__dirname, '../player-logins.json');

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
  const safeUsername = username.replace(/[^a-z0-9]/gi, '');
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `Dmrugby!${safeUsername}${suffix}`;
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
  return { status: response.status, ok: response.ok, data };
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

async function fetchPublicRows(table, select = '*') {
  if (!anonKey) {
    throw new Error('SUPABASE_ANON_KEY is required for public verification.');
  }

  const response = await fetch(`${projectUrl}/rest/v1/${table}?select=${encodeURIComponent(select)}`, {
    method: 'GET',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to query ${table}: ${response.status} ${body}`);
  }

  return response.json();
}

function saveLoginFile(entries) {
  const payload = entries.map((entry) => ({
    username: entry.username,
    email: entry.email,
    password: entry.password,
    status: entry.status,
    profileSaved: entry.profileSaved
  }));
  fs.writeFileSync(loginFilePath, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`Saved player login list to ${loginFilePath}`);
}

(async () => {
  console.log('Creating or verifying player auth accounts...');
  const results = [];

  for (const player of players) {
    const email = `${player.username}@dedanrugby.club`;
    const password = makePassword(player.username);
    let user = null;
    let status = 'created';
    let profileSaved = false;
    let errorMessage = null;

    const authResult = await createAuthUser(email, password);
    if (authResult.ok) {
      user = authResult.data;
    } else {
      const message = JSON.stringify(authResult.data);
      if (message.toLowerCase().includes('already exists') || authResult.status === 409) {
        const existing = await getUserByEmail(email);
        if (existing) {
          user = existing;
          status = 'exists';
        } else {
          errorMessage = 'Existing account detected but could not fetch user.';
        }
      } else {
        errorMessage = `Auth create failed: ${message}`;
      }
    }

    if (!user) {
      results.push({ username: player.username, email, status: 'failed', error: errorMessage });
      console.warn(`Player ${player.username} skipped: ${errorMessage}`);
      continue;
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
    if (profileResult.ok) {
      profileSaved = true;
    } else {
      errorMessage = `Profile save failed: ${JSON.stringify(profileResult.data)}`;
      console.warn(`Profile save failed for ${player.username}: ${errorMessage}`);
    }

    results.push({
      username: player.username,
      email,
      password,
      status,
      profileSaved,
      error: errorMessage
    });
  }

  saveLoginFile(results);
  console.log('
Player login summary:');
  results.forEach((item) => {
    console.log(`- ${item.username}: ${item.status}${item.error ? ` (${item.error})` : ''}`);
  });

  if (anonKey) {
    console.log('\nVerifying Supabase public tables...');
    try {
      const profiles = await fetchPublicRows('profiles');
      const matches = await fetchPublicRows('matches');
      console.log(`profiles rows: ${Array.isArray(profiles) ? profiles.length : 0}`);
      console.log(`matches rows: ${Array.isArray(matches) ? matches.length : 0}`);

      const profileNames = Array.isArray(profiles) ? profiles.map((row) => row.full_name || row.user_id) : [];
      const existingPlayers = players.filter((player) => profileNames.includes(player.full_name));
      console.log(`profiles matching expected players: ${existingPlayers.length}/${players.length}`);

      const nyeriMatches = Array.isArray(matches)
        ? matches.filter((row) => typeof row.opponent === 'string' && row.opponent.toLowerCase().includes('nyeri'))
        : [];
      console.log(`Nyeri-related matches found: ${nyeriMatches.length}`);
      if (nyeriMatches.length) {
        nyeriMatches.forEach((match) => {
          console.log(`  • ${match.opponent} on ${match.date || 'unknown date'} status=${match.status}`);
        });
      }
    } catch (verifyError) {
      console.error('Verification failed:', verifyError.message || verifyError);
    }
  } else {
    console.log('\nSkipping public verification because SUPABASE_ANON_KEY is not set.');
  }
})();

