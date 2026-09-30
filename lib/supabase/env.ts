/**
 * Reads the two Supabase settings from the environment (.env.local).
 *
 * Both values are safe to be seen in the browser. The "publishable" key
 * (older projects call it the "anon" key) only allows what the database's
 * Row Level Security rules allow.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function isSupabaseConfigured(): boolean {
  return Boolean(url && key && url.startsWith("http"));
}

export function getSupabaseEnv(): { url: string; key: string } {
  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Copy .env.example to .env.local and fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, then restart the app.",
    );
  }
  return { url, key };
}
