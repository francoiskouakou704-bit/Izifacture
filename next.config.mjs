import { PHASE_PRODUCTION_BUILD } from 'next/constants.js'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const isProd = process.env.NODE_ENV === 'production'

// Politique de contenu : seules les ressources du site et de Supabase (logos) sont autorisées.
// 'unsafe-inline' reste nécessaire aux scripts d'amorçage de Next.js (sans nonce) ; la CSP bloque
// néanmoins tout script ou cadre externe, les plugins et l'affichage du site dans un <iframe>.
// En développement, le rechargement à chaud de Next a besoin d'eval : pas de CSP.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ')

const securityHeaders = [
  ...(isProd ? [{ key: 'Content-Security-Policy', value: csp }] : []),
  // Anti-clickjacking pour les navigateurs qui ignorent frame-ancestors
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()' },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Les tests E2E construisent dans un dossier séparé pour ne pas casser `npm run dev`
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // Ne pas annoncer la technologie du serveur (en-tête X-Powered-By)
  poweredByHeader: false,
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // Lien public de facture : le jeton est dans l'URL, il ne doit fuiter ni par le Referer
      // ni dans les moteurs de recherche.
      {
        source: '/i/:token*',
        headers: [
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ]
  },
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
