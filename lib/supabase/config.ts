// Configuration Supabase lue depuis l'environnement (.env.local, Vercel).
// DATA_SOURCE=mock force les données locales (tests E2E, démo hors ligne).

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export function isSupabaseEnabled() {
  return process.env.DATA_SOURCE !== 'mock' && Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
}
