const results = [
  { date: 'Jun 28', opponent: 'Kisumu RFC', outcome: 'Won 24-14' },
  { date: 'Jun 21', opponent: 'Nairobi University', outcome: 'Lost 12-19' },
  { date: 'Jun 14', opponent: 'Mombasa Sharks', outcome: 'Won 31-10' }
];

const players = [
  { name: 'Brian Otieno', position: 'Fly-half', jersey: 10, bio: 'Leadership and game control' },
  { name: 'Moses Wanjala', position: 'Prop', jersey: 3, bio: 'Power in the scrum' },
  { name: 'Lilian Akinyi', position: 'Center', jersey: 12, bio: 'Breakthrough runner' },
  { name: 'Kevin Njoroge', position: 'Hooker', jersey: 2, bio: 'Lineout specialist' },
  { name: 'Davis Kibet', position: 'Wing', jersey: 7, bio: 'Explosive pace' },
  { name: 'Njeri Mugo', position: 'Fullback', jersey: 15, bio: 'Safe under the high ball' }
];

const SUPABASE_URL = 'https://ocyhnzyzahwlkxmngngy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_58AEN-aTnoJiU0FguWy08w_MaZapItE';
const CLOUDINARY_CLOUD = 'f80rob8p';
const CLOUDINARY_PRESET = 'dekutrugby';
const ADMIN_EMAIL = 'dedansrugby@gmail.com';
const AUTH_EMAIL_DOMAIN = '@dedanrugby.club';

const ROLE_LABELS = {
  admin: 'Admin',
  coach: 'Coach',
  manager: 'Team Manager',
  captain: 'Captain',
  player: 'Player'
};

let supabase = null;

function initSupabase() {
  if (!window.supabase || supabase) return true;
  try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return true;
  } catch (error) {
    console.warn('Supabase unavailable:', error);
    return false;
  }
}

async function renderResults() {
  const container = document.getElementById('resultsTicker');
  if (!container) return;

  if (!initSupabase()) {
    container.innerHTML = results.map((item) => `
      <div class="result-item">
        <div>
          <strong>${item.opponent}</strong>
          <div class="result-meta">${item.date}</div>
        </div>
        <div>${item.outcome}</div>
      </div>`).join('');
    return;
  }

  try {
    const { data, error } = await supabase.from('matches').select('*').order('date', { ascending: false }).limit(6);
    if (error) throw error;
    const fixtures = data || [];
    container.innerHTML = fixtures.length
      ? fixtures.map((fixture) => {
          const score = fixture.score_for != null && fixture.score_against != null ? `${fixture.score_for}-${fixture.score_against}` : 'TBC';
          const lineup = Array.isArray(fixture.lineup) ? fixture.lineup : [];
          return `
            <div class="result-item">
              <div>
                <strong>${fixture.opponent}</strong>
                <div class="result-meta">${new Date(fixture.date).toLocaleDateString()} • ${fixture.status}</div>
                <div class="result-meta">${fixture.notes || 'Match update pending.'}</div>
                ${lineup.length ? `<div class="result-meta">Lineup: ${lineup.join(', ')}</div>` : ''}
              </div>
              <div>${score}</div>
            </div>`;
        }).join('')
      : results.map((item) => `
        <div class="result-item">
          <div>
            <strong>${item.opponent}</strong>
            <div class="result-meta">${item.date}</div>
          </div>
          <div>${item.outcome}</div>
        </div>`).join('');
  } catch (error) {
    console.warn('Supabase results load failed:', error);
    container.innerHTML = results.map((item) => `
      <div class="result-item">
        <div>
          <strong>${item.opponent}</strong>
          <div class="result-meta">${item.date}</div>
        </div>
        <div>${item.outcome}</div>
      </div>`).join('');
  }
}

async function renderRoster() {
  const container = document.getElementById('rosterGrid');
  if (!container) return;

  const renderCards = (items) => {
    container.innerHTML = items.length
      ? items.map((player) => `
        <article class="player-card">
          <div class="jersey">#${player.jersey}</div>
          ${player.avatar ? `<img class="player-photo" src="${player.avatar}" alt="${player.name}" />` : ''}
          <h3>${player.name}</h3>
          <p>${player.position}</p>
          <p class="result-meta">${player.bio}</p>
        </article>`).join('')
      : '<p class="result-meta">No roster profiles are available yet.</p>';
  };

  if (!initSupabase()) {
    renderCards([]);
    return;
  }

  try {
    const { data, error } = await supabase.from('profiles').select('*').order('jersey_number', { ascending: true });
    if (error) throw error;
    const mapped = (data || []).map((row) => ({
      name: row.full_name || 'Player',
      position: row.position || 'Player',
      jersey: row.jersey_number || '—',
      bio: row.bio || 'Updated from Supabase',
      avatar: row.avatar_url || ''
    }));
    renderCards(mapped);
  } catch (error) {
    console.warn('Supabase roster load failed:', error);
    renderCards([]);
  }
}

function setupNav() {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (!toggle || !links) return;
  toggle.addEventListener('click', () => links.classList.toggle('open'));
}

function setSession(userEmail, role) {
  localStorage.setItem('dedanSession', JSON.stringify({ email: userEmail, role }));
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem('dedanSession') || 'null');
  } catch {
    return null;
  }
}

function getCurrentRole() {
  const session = getSession();
  return session?.role || null;
}

function canAccessAdminPanel() {
  const role = getCurrentRole();
  return role === 'admin' || role === 'manager';
}

function getRoleFromEmail(email) {
  const normalized = email.trim().toLowerCase();
  if (normalized === ADMIN_EMAIL.toLowerCase()) return 'admin';
  return 'player';
}

function getAuthEmail(identifier) {
  const trimmed = identifier.trim().toLowerCase();
  if (!trimmed) return '';
  if (trimmed.includes('@')) {
    return trimmed === ADMIN_EMAIL.toLowerCase() ? trimmed : '';
  }
  return `${trimmed}${AUTH_EMAIL_DOMAIN}`;
}

async function validateLogin(identifier, password) {
  const normalized = identifier.trim().toLowerCase();
  const authEmail = getAuthEmail(normalized);

  if (!authEmail) {
    return { ok: false, role: null };
  }

  if (!initSupabase()) {
    return { ok: false, role: null };
  }

  try {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email: authEmail, password });
    if (!signInError && signInData?.user) {
      const role = getRoleFromEmail(authEmail);
      setSession(authEmail, role);
      return { ok: true, role };
    }

    if (signInError && signInError.message) {
      console.warn('Supabase auth sign-in failed:', signInError.message);
    }
  } catch (error) {
    console.warn('Supabase auth failed:', error);
  }

  return { ok: false, role: null };
}

function setupLogin() {
  const form = document.getElementById('loginForm');
  const message = document.getElementById('loginMessage');
  if (!form || !message) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const identifier = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!identifier || !password) {
      message.textContent = 'Please enter both your username (or admin email) and password.';
      return;
    }

    const result = await validateLogin(identifier, password);
    if (!result.ok) {
      message.textContent = 'Invalid credentials. Players should use username/password, and only the admin should use email.';
      return;
    }

    message.textContent = result.role === 'admin' || result.role === 'manager' ? 'Access ready.' : 'Welcome back.';
    setTimeout(() => {
      window.location.href = result.role === 'admin' || result.role === 'manager' ? 'admin.html' : 'team.html';
    }, 650);
  });
}

function setupCloudinary() {
  const button = document.getElementById('uploadPhoto');
  const message = document.getElementById('uploadMessage');
  const preview = document.getElementById('profilePhotoPreview');
  if (!button || !message) return;

  const updatePreview = (url) => {
    if (preview && url) {
      preview.src = url;
      preview.style.display = 'block';
    }
  };

  const savedUrl = localStorage.getItem('dedanCloudinaryUrl');
  if (savedUrl) updatePreview(savedUrl);

  button.addEventListener('click', () => {
    if (!window.cloudinary) {
      message.textContent = 'Cloudinary widget is not available.';
      return;
    }

    const widget = window.cloudinary.createUploadWidget({
      cloudName: CLOUDINARY_CLOUD,
      uploadPreset: CLOUDINARY_PRESET,
      sources: ['local', 'url'],
      multiple: false
    }, (error, result) => {
      if (!error && result && result.event === 'success') {
        const url = result.info.secure_url;
        localStorage.setItem('dedanCloudinaryUrl', url);
        message.textContent = 'Profile photo uploaded.';
        updatePreview(url);
      }
      if (error) {
        message.textContent = 'Cloudinary upload failed.';
        console.warn('Cloudinary upload error:', error);
      }
    });

    widget.open();
  });
}

async function renderFixtures() {
  const container = document.getElementById('fixturePitch');
  if (!container) return;

  if (!initSupabase()) {
    container.innerHTML = '<article class="fixture-card"><h3>Supabase unavailable</h3><p>Fixtures cannot be loaded right now.</p></article>';
    return;
  }

  try {
    const { data, error } = await supabase.from('matches').select('*').order('date', { ascending: true });
    if (error) throw error;
    const fixtures = data || [];
    container.innerHTML = fixtures.length
      ? fixtures.map((fixture) => {
          const lineup = Array.isArray(fixture.lineup) ? fixture.lineup : [];
          const updateText = fixture.notes || 'No update yet.';
          return `
            <article class="fixture-card">
              <h3>${fixture.opponent}</h3>
              <p>${new Date(fixture.date).toLocaleDateString()}</p>
              <p>${fixture.venue}</p>
              <p>${fixture.format}</p>
              <p>${fixture.status}</p>
              <p>Score: ${fixture.score_for ?? 0}-${fixture.score_against ?? 0}</p>
              <p>${updateText}</p>
              ${lineup.length ? `<p>Lineup: ${lineup.join(', ')}</p>` : ''}
            </article>`;
        }).join('')
      : '<article class="fixture-card"><h3>No fixtures yet</h3><p>Create one from the admin panel.</p></article>';
  } catch (error) {
    console.warn('Supabase fixtures load failed:', error);
    container.innerHTML = '<article class="fixture-card"><h3>Fixtures unavailable</h3><p>Supabase returned an error.</p></article>';
  }
}

function setupAdminPage() {
  const form = document.getElementById('matchForm');
  const list = document.getElementById('matchList');
  const message = document.getElementById('adminMessage');
  if (!form || !list) return;

  if (!canAccessAdminPanel()) {
    if (message) message.textContent = 'Please sign in as an admin or team manager to manage fixtures.';
    form.style.display = 'none';
    return;
  }

  const renderMatches = (matches) => {
    list.innerHTML = matches.length
      ? matches.map((match) => `
        <article class="admin-item">
          <strong>${match.opponent}</strong>
          <p>${new Date(match.date).toLocaleString()} • ${match.venue}</p>
          <p class="result-meta">${match.format} • ${match.status}</p>
        </article>`).join('')
      : '<p class="result-meta">No matches yet.</p>';
  };

  const loadMatches = async () => {
    if (!initSupabase()) {
      if (message) message.textContent = 'Supabase is unavailable.';
      return;
    }

    try {
      const { data, error } = await supabase.from('matches').select('*').order('date', { ascending: true });
      if (error) throw error;
      renderMatches(data || []);
      await renderFixtures();
    } catch (error) {
      console.warn('Supabase match load failed:', error);
      if (message) message.textContent = 'Fixtures could not be loaded from Supabase.';
    }
  };

  loadMatches();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!initSupabase()) {
      if (message) message.textContent = 'Supabase is unavailable.';
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !['admin', 'manager'].includes(getCurrentRole())) {
      if (message) message.textContent = 'Please sign in with a real Supabase account to save fixtures.';
      return;
    }

    const formData = new FormData(form);
    const match = Object.fromEntries(formData.entries());
    const payload = {
      opponent: match.opponent,
      date: new Date(`${match.date}T00:00:00`).toISOString(),
      venue: match.venue || 'Dedan Kimathi Grounds',
      format: match.format || '15s',
      status: match.status || 'scheduled',
      notes: match.notes || '',
      score_for: 0,
      score_against: 0,
      result: 'pending'
    };

    try {
      const { error } = await supabase.from('matches').insert([payload]);
      if (error) throw error;
      form.reset();
      if (message) message.textContent = 'Fixture saved to Supabase.';
      await loadMatches();
    } catch (error) {
      console.warn('Supabase match save failed:', error);
      if (message) message.textContent = error.message || 'Unable to save fixture to Supabase.';
    }
  });
}

function setYears() {
  document.querySelectorAll('#year').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
}

async function setupProfilePage() {
  const form = document.getElementById('profileForm');
  const message = document.getElementById('profileMessage');
  if (!form || !message) return;

  const session = getSession();
  if (!session) {
    message.textContent = 'Please login first.';
    return;
  }

  if (!initSupabase()) {
    message.textContent = 'Supabase is unavailable right now.';
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    message.textContent = 'Please sign in with a real Supabase account to save your profile.';
    return;
  }

  try {
    const { data: profile, error } = await supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
    if (error) throw error;
    currentProfile = profile || null;
    if (profile) {
      const fullNameField = form.elements.namedItem('fullName');
      const positionField = form.elements.namedItem('position');
      const jerseyField = form.elements.namedItem('jerseyNumber');
      const notesField = form.elements.namedItem('notes');
      if (fullNameField) fullNameField.value = profile.full_name || '';
      if (positionField) positionField.value = profile.position || '';
      if (jerseyField) jerseyField.value = profile.jersey_number || '';
      if (notesField) notesField.value = profile.bio || '';
      if (profile.avatar_url) {
        localStorage.setItem('dedanCloudinaryUrl', profile.avatar_url);
        const preview = document.getElementById('profilePhotoPreview');
        if (preview) {
          preview.src = profile.avatar_url;
          preview.style.display = 'block';
        }
      }
    }
  } catch (error) {
    console.warn('Supabase profile load failed:', error);
  }

  let currentProfile = null;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    const uploadedAvatar = localStorage.getItem('dedanCloudinaryUrl');
    const payload = {
      user_id: user.id,
      full_name: data.fullName || '',
      position: data.position || '',
      jersey_number: Number(data.jerseyNumber) || 0,
      bio: data.notes || '',
      avatar_url: uploadedAvatar || currentProfile?.avatar_url || ''
    };

    try {
      const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'user_id' });
      if (error) throw error;
      message.textContent = 'Profile saved to Supabase.';
    } catch (error) {
      console.warn('Supabase profile save failed:', error);
      message.textContent = error.message || 'Unable to save profile.';
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  renderResults();
  renderRoster();
  setupNav();
  setupLogin();
  setupCloudinary();
  if (window.location.pathname.includes('admin.html') && !canAccessAdminPanel()) {
    window.location.href = 'login.html';
    return;
  }
  setupAdminPage();
  setupProfilePage();
  renderFixtures();
  setYears();
});
