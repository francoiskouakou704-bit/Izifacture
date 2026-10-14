// Configuration Supabase lue depuis l'environnement (.env.local, Vercel).
// DATA_SOURCE=mock force les données locales (tests E2E, démo hors ligne).

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export function isSupabaseEnabled() {
  if (process.env.DATA_SOURCE === 'mock') return false
  if (SUPABASE_URL && SUPABASE_ANON_KEY) return true
  // En production, jamais de bascule silencieuse vers la démo : n'importe qui pourrait
  // « se connecter » et voir les données fictives. Le mode démo doit être demandé explicitement.
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Supabase non configuré : définir NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY (ou DATA_SOURCE=mock pour la démo).',
    )
  }
  return false
}
