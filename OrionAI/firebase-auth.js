/* ============================================================
   OrionAI — firebase-auth.js
   Firebase Authentication: Google + Email/Password
   Role-based access: admin | staff
   ============================================================ */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// ── Firebase Config ────────────────────────────────────────
const firebaseConfig = {
  apiKey:            'AIzaSyAaM3eClyhBEjlSQLn5KAarqp6hue2ae6M',
  authDomain:        'vitalsync-6ab1b.firebaseapp.com',
  projectId:         'vitalsync-6ab1b',
  storageBucket:     'vitalsync-6ab1b.firebasestorage.app',
  messagingSenderId: '568590722090',
  appId:             '1:568590722090:web:0ac02e16e22e70fa91cf53',
  measurementId:     'G-C91GM8L053',
};

// ── Init ───────────────────────────────────────────────────
const app      = initializeApp(firebaseConfig);
const auth     = getAuth(app);
const db       = getFirestore(app);
const provider = new GoogleAuthProvider();

// Add Google provider scopes
provider.addScope('email');
provider.addScope('profile');

// ── Role Definitions ───────────────────────────────────────
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

// ── Get or Create User Profile in Firestore ────────────────
async function ensureUserProfile(user, overrideRole = null) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    // First time: create profile with default 'staff' role
    const profile = {
      uid:         user.uid,
      email:       user.email,
      displayName: user.displayName || '',
      photoURL:    user.photoURL || '',
      role:        overrideRole || 'staff',
      createdAt:   serverTimestamp(),
      lastLogin:   serverTimestamp(),
    };
    await setDoc(ref, profile);
    return profile;
  } else {
    // Update last login
    const data = snap.data();
    await setDoc(ref, { lastLogin: serverTimestamp() }, { merge: true });
    return data;
  }
}

// ── Auth State Observer ────────────────────────────────────
export function initAuthObserver() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const profile = await ensureUserProfile(user);
        onSignedIn(user, profile);
      } catch (err) {
        console.error('Error fetching user profile:', err);
        showAuthError('Failed to load user profile. Please try again.');
      }
    } else {
      onSignedOut();
    }
  });
}

// ── Sign In — Email / Password ─────────────────────────────
export async function signInEmail(email, password) {
  setAuthLoading(true, 'Authenticating…');
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  } catch (err) {
    setAuthLoading(false);
    showAuthError(friendlyError(err.code));
    throw err;
  }
}

// ── Sign Up — Email / Password ─────────────────────────────
export async function signUpEmail(email, password, firstName, lastName, organisation, role = 'staff') {
  setAuthLoading(true, 'Creating account…');
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    // Override role for first-ever admin setup (if email matches)
    const assignedRole = await resolveSignupRole(email, role);
    await ensureUserProfile({
      uid:         cred.user.uid,
      email:       cred.user.email,
      displayName: `${firstName} ${lastName}`.trim(),
      photoURL:    null,
    }, assignedRole);
    // Store extra fields
    await setDoc(doc(db, 'users', cred.user.uid), {
      organisation,
      firstName,
      lastName,
    }, { merge: true });
    return cred.user;
  } catch (err) {
    setAuthLoading(false);
    showAuthError(friendlyError(err.code));
    throw err;
  }
}

// ── Sign In — Google ───────────────────────────────────────
export async function signInGoogle() {
  setAuthLoading(true, 'Connecting to Google…');
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (err) {
    setAuthLoading(false);
    if (err.code !== 'auth/popup-closed-by-user') {
      showAuthError(friendlyError(err.code));
    }
    throw err;
  }
}

// ── Sign Out ───────────────────────────────────────────────
export async function signOutUser() {
  await signOut(auth);
}

// ── Password Reset ─────────────────────────────────────────
export async function sendReset(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    showAuthSuccess('Password reset email sent! Check your inbox.');
  } catch (err) {
    showAuthError(friendlyError(err.code));
  }
}

// ── Helpers ────────────────────────────────────────────────
async function resolveSignupRole(email, requestedRole) {
  // If the signing-up email is the project owner, grant admin
  // Add your admin email(s) here
  const ADMIN_EMAILS = ['manjunathshashank08@gmail.com'];
  if (ADMIN_EMAILS.includes(email.toLowerCase())) return 'admin';
  return requestedRole;
}

function friendlyError(code) {
  const map = {
    'auth/user-not-found':          'No account found with this email.',
    'auth/wrong-password':          'Incorrect password. Please try again.',
    'auth/email-already-in-use':   'An account with this email already exists.',
    'auth/weak-password':           'Password must be at least 6 characters.',
    'auth/invalid-email':           'Please enter a valid email address.',
    'auth/too-many-requests':       'Too many attempts. Please wait a moment.',
    'auth/network-request-failed':  'Network error. Check your connection.',
    'auth/popup-blocked':           'Popup blocked. Please allow popups for this site.',
    'auth/cancelled-popup-request': 'Sign-in cancelled.',
    'auth/invalid-credential':      'Invalid credentials. Please check your email/password.',
  };
  return map[code] || 'An unexpected error occurred. Please try again.';
}

// ── UI State Helpers ───────────────────────────────────────
function setAuthLoading(isLoading, msg = '') {
  const loginBtn  = document.getElementById('authSignInBtn');
  const signupBtn = document.getElementById('authSignUpBtn');
  const googleBtn = document.getElementById('authGoogleBtn');
  const btn = document.querySelector('.auth-form-section.visible .auth-btn-primary');

  if (isLoading) {
    [loginBtn, signupBtn, googleBtn, btn].filter(Boolean).forEach(b => {
      b._origText = b.innerHTML;
      b.innerHTML = `<span class="auth-spinner"></span> ${msg}`;
      b.disabled = true;
      b.style.opacity = '0.8';
    });
  } else {
    [loginBtn, signupBtn, googleBtn, btn].filter(Boolean).forEach(b => {
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

function showAuthSuccess(message) {
  let el = document.getElementById('authSuccessMsg');
  if (!el) {
    el = document.createElement('div');
    el.id = 'authSuccessMsg';
    el.className = 'auth-success-msg';
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

  // Update sidebar user badge
  updateUserBadge(user, profile, roleInfo);

  // Apply role-based nav restrictions
  applyRoleRestrictions(role, roleInfo);

  // Fade out auth overlay
  const overlay = document.getElementById('authOverlay');
  if (overlay && !overlay.classList.contains('hidden-overlay')) {
    overlay.classList.add('hidden-overlay');
    setTimeout(() => {
      overlay.style.display = 'none';
      // Trigger map init after overlay is removed
      if (typeof initMiniMap === 'function' && !window._miniMapInited) {
        initMiniMap();
        window._miniMapInited = true;
      }
    }, 520);
  }
}

// ── On Signed Out — show auth overlay ─────────────────────
function onSignedOut() {
  const overlay = document.getElementById('authOverlay');
  if (overlay) {
    overlay.style.display = 'flex';
    overlay.classList.remove('hidden-overlay');
  }
  // Remove user badge
  const badge = document.getElementById('userSessionBadge');
  if (badge) badge.remove();
  // Reset version text
  const ver = document.querySelector('.sidebar-version');
  if (ver) ver.textContent = 'v2.0 · Not logged in';
}

// ── Update User Badge in Sidebar ──────────────────────────
function updateUserBadge(user, profile, roleInfo) {
  // Remove old if exists
  let badge = document.getElementById('userSessionBadge');
  if (badge) badge.remove();

  const footer = document.querySelector('.sidebar-footer');
  if (!footer) return;

  badge = document.createElement('div');
  badge.id = 'userSessionBadge';
  badge.className = 'user-session-badge';
  badge.innerHTML = `
    <div class="user-avatar" style="background:linear-gradient(135deg,${roleInfo.color}88,${roleInfo.color}44)">
      ${user.photoURL
        ? `<img src="${user.photoURL}" alt="avatar" class="user-avatar-img">`
        : `<span>${(user.displayName || user.email || 'U')[0].toUpperCase()}</span>`}
    </div>
    <div class="user-info">
      <div class="user-name">${user.displayName || user.email?.split('@')[0] || 'User'}</div>
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

  // Update sidebar version text
  const ver = document.querySelector('.sidebar-version');
  if (ver) ver.textContent = `v2.0 · ${roleInfo.label} Access`;
}

// ── Apply Role Restrictions ────────────────────────────────
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

// ── Export current auth ────────────────────────────────────
export { auth, db, ROLES };
