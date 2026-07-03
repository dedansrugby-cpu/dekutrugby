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
const DEMO_USERS = {
  'admin@dedan.com': 'dedan2026',
  'player@dedan.com': 'player2026'
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

function renderResults() {
  const container = document.getElementById('resultsTicker');
  if (!container) return;
  container.innerHTML = results.map((item) => `
    <div class="result-item">
      <div>
        <strong>${item.opponent}</strong>
        <div class="result-meta">${item.date}</div>
      </div>
      <div>${item.outcome}</div>
    </div>`).join('');
}

function renderRoster() {
  const container = document.getElementById('rosterGrid');
  if (!container) return;

  const renderCards = (items) => {
    container.innerHTML = items.map((player) => `
      <article class="player-card">
        <div class="jersey">#${player.jersey}</div>
        <h3>${player.name}</h3>
        <p>${player.position}</p>
        <p class="result-meta">${player.bio}</p>
      </article>`).join('');
  };

  const cached = localStorage.getItem('dedanRoster');
  if (cached) {
    renderCards(JSON.parse(cached));
  } else {
    renderCards(players);
  }

  if (!initSupabase()) return;
  supabase.from('profiles').select('*').order('jersey_number', { ascending: true }).then(({ data, error }) => {
    if (!error && data && data.length) {
      const mapped = data.map((row) => ({
        name: row.full_name,
        position: row.position,
        jersey: row.jersey_number,
        bio: row.bio || 'Updated from Supabase'
      }));
      localStorage.setItem('dedanRoster', JSON.stringify(mapped));
      renderCards(mapped);
    }
  }).catch(() => {});
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

async function validateLogin(email, password) {
  const normalized = email.trim().toLowerCase();
  if (DEMO_USERS[normalized] === password) {
    setSession(normalized, normalized.includes('admin') ? 'admin' : 'player');
    return { ok: true, role: normalized.includes('admin') ? 'admin' : 'player' };
  }

  if (initSupabase()) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: normalized, password });
      if (!error && data?.user) {
        setSession(normalized, normalized.includes('admin') ? 'admin' : 'player');
        return { ok: true, role: normalized.includes('admin') ? 'admin' : 'player' };
      }
    } catch (error) {
      console.warn('Supabase auth sign-in failed:', error);
    }
  }

  return { ok: false, role: null };
}

function setupLogin() {
  const form = document.getElementById('loginForm');
  const message = document.getElementById('loginMessage');
  if (!form || !message) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
      message.textContent = 'Please enter both email and password.';
      return;
    }

    const result = await validateLogin(email, password);
    if (!result.ok) {
      message.textContent = 'Invalid credentials. Try the demo accounts listed below.';
      return;
    }

    message.textContent = result.role === 'admin' ? 'Admin access ready.' : 'Welcome back.';
    setTimeout(() => {
      window.location.href = result.role === 'admin' ? 'admin.html' : 'team.html';
    }, 650);
  });
}

function setupCloudinary() {
  const button = document.getElementById('uploadPhoto');
  const message = document.getElementById('uploadMessage');
  if (!button || !message) return;

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
        message.textContent = `Uploaded: ${url}`;
      }
    });

    widget.open();
  });
}

function setupAdminPage() {
  const form = document.getElementById('matchForm');
  const list = document.getElementById('matchList');
  const message = document.getElementById('adminMessage');
  if (!form || !list) return;

  const saveMatches = (matches) => {
    localStorage.setItem('dedanMatches', JSON.stringify(matches));
    renderMatches(matches);
  };

  const renderMatches = (matches) => {
    list.innerHTML = matches.length
      ? matches.map((match) => `
        <article class="admin-item">
          <strong>${match.opponent}</strong>
          <p>${match.date} • ${match.venue}</p>
          <p class="result-meta">${match.format} • ${match.status}</p>
        </article>`).join('')
      : '<p class="result-meta">No matches yet.</p>';
  };

  const existing = JSON.parse(localStorage.getItem('dedanMatches') || '[]');
  renderMatches(existing);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const match = Object.fromEntries(formData.entries());
    const updated = [
      { ...match, id: Date.now().toString() },
      ...existing
    ];
    saveMatches(updated);
    if (message) message.textContent = 'Match saved locally and ready for Supabase sync.';
    form.reset();
  });
}

function setYears() {
  document.querySelectorAll('#year').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
}

window.addEventListener('DOMContentLoaded', () => {
  renderResults();
  renderRoster();
  setupNav();
  setupLogin();
  setupCloudinary();
  setupAdminPage();
  setYears();
});
