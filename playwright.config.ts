import { defineConfig, devices } from '@playwright/test'

const PORT = 3200

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false, // la base locale est partagée par le serveur
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: 'fr-FR',
    timezoneId: 'Africa/Dakar',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    // Build dédié dans .next-e2e : n'interfère pas avec un `npm run dev` en cours
    command: `npx next build && npx next start -p ${PORT}`,
    // Données locales en mémoire : les tests ne touchent jamais la base Supabase
    env: { NEXT_DIST_DIR: '.next-e2e', DATA_SOURCE: 'mock' },
    url: `http://localhost:${PORT}/login`,
    reuseExistingServer: false,
    timeout: 300_000,
  },
})
