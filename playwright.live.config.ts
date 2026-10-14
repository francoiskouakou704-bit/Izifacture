import { defineConfig, devices } from '@playwright/test'

// Tests contre la vraie base Supabase (voir tests/live/supabase.spec.ts).
// Nécessite un serveur déjà lancé avec .env.local (Supabase) : LIVE_BASE_URL, ex. http://localhost:3000
export default defineConfig({
  testDir: './tests/live',
  timeout: 60_000,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.LIVE_BASE_URL ?? 'http://localhost:3000',
    locale: 'fr-FR',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'live', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } }],
})
