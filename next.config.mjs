import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Les tests E2E construisent dans un dossier séparé pour ne pas casser `npm run dev`
  distDir: process.env.NEXT_DIST_DIR || '.next',
  experimental: {
    // Logo jusqu'à 2 Mo, transmis en base64 (~ +33 %)
    serverActions: { bodySizeLimit: '3mb' },
  },
}

export default withNextIntl(nextConfig)
