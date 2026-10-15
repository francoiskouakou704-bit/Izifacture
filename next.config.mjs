import { PHASE_PRODUCTION_BUILD } from 'next/constants.js'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Les tests E2E construisent dans un dossier séparé pour ne pas casser `npm run dev`
  distDir: process.env.NEXT_DIST_DIR || '.next',
  experimental: {
    // Logo jusqu'à 2 Mo, transmis en base64 (~ +33 %)
    serverActions: { bodySizeLimit: '3mb' },
    // Pages déjà visitées réaffichées sans rechargement pendant 30 s ; les Server Actions
    // (revalidatePath) vident ce cache, les données modifiées restent donc à jour.
    staleTimes: { dynamic: 30 },
  },
}

export default function config(phase) {
  // Un build de production sans Supabase échoue tout de suite (ex. variables absentes sur Vercel)
  // au lieu de publier un site en mode démo. DATA_SOURCE=mock l'autorise (CI, tests E2E).
  if (phase === PHASE_PRODUCTION_BUILD && process.env.DATA_SOURCE !== 'mock') {
    const missing = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'].filter((k) => !process.env[k])
    if (missing.length) {
      throw new Error(`Variables d'environnement manquantes : ${missing.join(', ')} (ou DATA_SOURCE=mock pour la démo).`)
    }
  }
  return withNextIntl(nextConfig)
}
