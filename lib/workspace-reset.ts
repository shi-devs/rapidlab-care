// Older ChatGPT Sites builds used this hook for a one-time D1 reset. A fresh
// Supabase database already starts empty, so Vercel must never erase data on a
// normal profile request.
export function ensureRecoverableWorkspaceReset() {
  return Promise.resolve();
}
