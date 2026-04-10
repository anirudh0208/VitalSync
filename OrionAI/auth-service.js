/* ============================================================
   OrionAI — auth-service.js
   FastAPI Backend Authentication integration
   ============================================================ */

const API_BASE = 'http://localhost:8000';

// ── Role Definitions (matching what was in firebase-auth.js) ─
const ROLES = {
  admin: {
    label: 'Admin',
    color: '#ef4444',
    badge: '👑',
    permissions: ['dashboard', 'tracking', 'route', 'cost', 'coldchain', 'emergency', 'weather', 'alerts', 'assistant', 'history', 'fleet_management', 'user_management'],
  },
  staff: {
    label: 'Staff',
    color: '#3b82f6',
    badge: '🔵',
    permissions: ['dashboard', 'tracking', 'route', 'cost', 'coldchain', 'alerts', 'assistant', 'history'],
  },
};

// ── Auth State Observer ────────────────────────────────────
export async function initAuthObserver() {
  console.log('initAuthObserver started');
  const token = localStorage.getItem('orionai_token');
  if (token) {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const user = await res.json();
        // Backend doesn't currently store roles, defaulting to admin for now or staff
        // You can extend the backend user model later
        const profile = { role: user.email.includes('admin') ? 'admin' : 'staff', ...user };
        onSignedIn(user, profile);
      } else {
        localStorage.removeItem('orionai_token');
        onSignedOut();
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      onSignedOut();
    }
  } else {
    onSignedOut();
  }
}

// ── Sign In — Email / Password ─────────────────────────────
export async function signInEmail(email, password) {
  setAuthLoading(true, 'Authenticating…');
  try {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData
    });

    console.log('Login response status:', res.status);

    if (!res.ok) {
      const err = await res.json();
      console.error('Login error details:', err);
      throw new Error(err.detail || 'Login failed');
    }

    const data = await res.json();
    localStorage.setItem('orionai_token', data.access_token);
    
    const user = data.user;
    const profile = { role: user.email.includes('admin') ? 'admin' : 'staff', ...user };
    onSignedIn(user, profile);
    return user;
  } catch (err) {
    setAuthLoading(false);
    showAuthError(err.message);
    throw err;
  }
}

// ── Sign Up — Email / Password ─────────────────────────────
export async function signUpEmail(email, password, firstName, lastName, organisation, role = 'staff') {
  setAuthLoading(true, 'Creating account…');
  try {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        email: email,
        organisation: organisation,
        password: password
      })
    });

    console.log('Signup response status:', res.status);

    if (!res.ok) {
      const err = await res.json();
      console.error('Signup error details:', err);
      throw new Error(err.detail || 'Signup failed');
    }

    const data = await res.json();
    localStorage.setItem('orionai_token', data.access_token);
    
    const user = data.user;
    const profile = { role: user.email.includes('admin') ? 'admin' : 'staff', ...user };
    onSignedIn(user, profile);
    return user;
  } catch (err) {
    setAuthLoading(false);
    showAuthError(err.message);
    throw err;
  }
}

// ── Sign In — Google (Mock for now) ────────────────────────
export async function signInGoogle() {
  showAuthError('Google sign-in is not available in local mode. Please use email/password.');
  throw new Error('Not implemented');
}

// ── Sign Out ───────────────────────────────────────────────
export async function signOutUser() {
  localStorage.removeItem('orionai_token');
  onSignedOut();
}

// ── Password Reset (Mock) ──────────────────────────────────
export async function sendReset(email) {
  showAuthError('Password reset is not available in local mode.');
}

// ── UI State Helpers ───────────────────────────────────────
function setAuthLoading(isLoading, msg = '') {
  const loginBtn  = document.getElementById('authSignInBtn');
  const signupBtn = document.getElementById('authSignUpBtn');
  const btn = document.querySelector('.auth-form-section.visible .auth-btn-primary');

  if (isLoading) {
    [loginBtn, signupBtn, btn].filter(Boolean).forEach(b => {
      b._origText = b.innerHTML;
      b.innerHTML = `<span class="auth-spinner"></span> ${msg}`;
      b.disabled = true;
      b.style.opacity = '0.8';
    });
  } else {
    [loginBtn, signupBtn, btn].filter(Boolean).forEach(b => {
      if (b._origText) b.innerHTML = b._origText;
      b.disabled = false;
      b.style.opacity = '';
    });
  }
}

function showAuthError(message) {
  let el = document.getElementById('authErrorMsg');
  if (!el) {
    el = document.createElement('div');
    el.id = 'authErrorMsg';
    el.className = 'auth-error-msg';
    const card = document.querySelector('.auth-card');
    if (card) card.prepend(el);
  }
  el.textContent = message;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 5000);
}

// ── On Signed In — show dashboard ─────────────────────────
function onSignedIn(user, profile) {
  const role      = profile.role || 'staff';
  const roleInfo  = ROLES[role] || ROLES.staff;

  updateUserBadge(user, profile, roleInfo);
  applyRoleRestrictions(role, roleInfo);

  const overlay = document.getElementById('authOverlay');
  if (overlay && !overlay.classList.contains('hidden-overlay')) {
    overlay.classList.add('hidden-overlay');
    setTimeout(() => {
      overlay.style.display = 'none';
      if (typeof window.initMiniMap === 'function' && !window._miniMapInited) {
        window.initMiniMap();
        window._miniMapInited = true;
      }
    }, 520);
  }
}

function onSignedOut() {
  const overlay = document.getElementById('authOverlay');
  if (overlay) {
    overlay.style.display = 'flex';
    overlay.classList.remove('hidden-overlay');
  }
  const badge = document.getElementById('userSessionBadge');
  if (badge) badge.remove();
  const ver = document.querySelector('.sidebar-version');
  if (ver) ver.textContent = 'v2.0 · Not logged in';
}

function updateUserBadge(user, profile, roleInfo) {
  let badge = document.getElementById('userSessionBadge');
  if (badge) badge.remove();

  const footer = document.querySelector('.sidebar-footer');
  if (!footer) return;

  const displayName = profile.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : user.email?.split('@')[0] || 'User';

  badge = document.createElement('div');
  badge.id = 'userSessionBadge';
  badge.className = 'user-session-badge';
  badge.innerHTML = `
    <div class="user-avatar" style="background:linear-gradient(135deg,${roleInfo.color}88,${roleInfo.color}44)">
      <span>${displayName[0].toUpperCase()}</span>
    </div>
    <div class="user-info">
      <div class="user-name">${displayName}</div>
      <div class="user-role" style="color:${roleInfo.color}">${roleInfo.badge} ${roleInfo.label}</div>
    </div>
    <button class="sign-out-btn" id="signOutBtn" title="Sign Out">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
    </button>
  `;
  footer.insertBefore(badge, footer.firstChild);

  document.getElementById('signOutBtn').addEventListener('click', async () => {
    if (confirm('Sign out from OrionAI?')) {
      await signOutUser();
    }
  });

  const ver = document.querySelector('.sidebar-version');
  if (ver) ver.textContent = `v2.0 · ${roleInfo.label} Access`;
}

function applyRoleRestrictions(role, roleInfo) {
  const allNavItems = document.querySelectorAll('.nav-item[data-section]');
  allNavItems.forEach(item => {
    const section = item.dataset.section;
    const allowed = roleInfo.permissions.includes(section);
    if (!allowed) {
      item.classList.add('nav-restricted');
      item.setAttribute('title', 'Admin access required');
      item.style.opacity = '0.4';
      item.style.pointerEvents = 'none';
    } else {
      item.classList.remove('nav-restricted');
      item.removeAttribute('title');
      item.style.opacity = '';
      item.style.pointerEvents = '';
    }
  });
}
