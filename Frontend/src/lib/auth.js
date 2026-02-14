import { firebaseConfig, firebaseEnabled } from "@/lib/firebase";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
const AUTH_STORAGE_KEY = "verifixia_auth_session";

function readSession() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSession(session) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  window.dispatchEvent(new CustomEvent("verifixia-auth-changed"));
}

function clearSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("verifixia-auth-changed"));
}

function isExpired(session) {
  return !session?.expiresAt || Date.now() >= session.expiresAt;
}

async function callIdentityToolkit(endpoint, payload) {
  if (!firebaseEnabled) {
    throw new Error("Firebase is not configured. Add VITE_FIREBASE_* values in Frontend/.env.");
  }

  const url = `https://identitytoolkit.googleapis.com/v1/${endpoint}?key=${firebaseConfig.apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    const code = data?.error?.message || "AUTH_FAILED";
    throw new Error(code.replaceAll("_", " "));
  }

  return data;
}

function normalizeUser(data) {
  return {
    uid: data.localId,
    email: data.email,
    displayName: data.displayName || null,
    photoURL: data.photoUrl || null,
  };
}

async function syncProfileToBackend(extra = {}) {
  const token = await getAuthToken();
  if (!token) return;

  await fetch(`${API_BASE}/api/auth/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(extra),
  }).catch(() => {
    // Backend Firebase is optional; do not block login/signup flow.
  });
}

export async function registerWithEmail({ email, password, displayName }) {
  const data = await callIdentityToolkit("accounts:signUp", {
    email,
    password,
    returnSecureToken: true,
  });

  let token = data.idToken;
  let userData = data;

  if (displayName) {
    const updated = await callIdentityToolkit("accounts:update", {
      idToken: token,
      displayName,
      returnSecureToken: true,
    });
    token = updated.idToken;
    userData = updated;
  }

  const session = {
    idToken: token,
    refreshToken: userData.refreshToken,
    expiresAt: Date.now() + Number(userData.expiresIn || 3600) * 1000,
    user: normalizeUser(userData),
  };

  writeSession(session);
  await syncProfileToBackend({ display_name: displayName || null });
  return session.user;
}

export async function loginWithEmail({ email, password }) {
  const data = await callIdentityToolkit("accounts:signInWithPassword", {
    email,
    password,
    returnSecureToken: true,
  });

  const session = {
    idToken: data.idToken,
    refreshToken: data.refreshToken,
    expiresAt: Date.now() + Number(data.expiresIn || 3600) * 1000,
    user: normalizeUser(data),
  };

  writeSession(session);
  await syncProfileToBackend();
  return session.user;
}

export async function logoutUser() {
  clearSession();
}

export function watchAuthState(callback) {
  const emit = () => {
    const session = readSession();
    callback(session && !isExpired(session) ? session.user : null);
  };

  emit();
  const onChange = () => emit();

  window.addEventListener("verifixia-auth-changed", onChange);
  window.addEventListener("storage", onChange);

  return () => {
    window.removeEventListener("verifixia-auth-changed", onChange);
    window.removeEventListener("storage", onChange);
  };
}

export async function getAuthToken() {
  const session = readSession();
  if (!session || isExpired(session)) return null;
  return session.idToken;
}

export function getCurrentUser() {
  const session = readSession();
  if (!session || isExpired(session)) return null;
  return session.user;
}

export { firebaseEnabled };
