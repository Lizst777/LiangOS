const OWNER_EMAIL = "notes-owner@liangos.local";
const SESSION_RESTORE_TIMEOUT = 8000;
const SIGN_IN_TIMEOUT = 12_000;

export const hasSupabaseConfig = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY,
);

function withTimeout(promise, timeout, message) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(message)), timeout);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    window.clearTimeout(timeoutId);
  });
}

export function restoreOwnerSession(client) {
  return withTimeout(
    client.auth.getSession(),
    SESSION_RESTORE_TIMEOUT,
    "Session restore timed out.",
  );
}

export function signInOwner(client, password) {
  return withTimeout(
    client.auth.signInWithPassword({ email: OWNER_EMAIL, password }),
    SIGN_IN_TIMEOUT,
    "Sign in timed out.",
  );
}
