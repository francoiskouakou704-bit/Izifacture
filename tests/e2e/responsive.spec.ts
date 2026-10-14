import { expect, test } from '@playwright/test'

// Garde-fou : aucune page ne doit défiler horizontalement sur téléphone.
// (Bug réel corrigé : un `sr-only` absolu dans un <th> élargissait toute la page.)

const PAGES = [
  '/dashboard',
  '/invoices',
  '/invoices?status=paid',
  '/invoices/new',
  '/invoices/inv_40',
  '/invoices/inv_47',
  '/clients',
  '/clients/cli_1',
  '/settings',
  '/onboarding',
  '/login',
  '/signup',
]

for (const width of [320, 375, 414, 768]) {
  test.describe(`largeur ${width}px`, () => {
    test.use({ viewport: { width, height: 800 } })

    for (const path of PAGES) {
      test(`pas de défilement horizontal sur ${path}`, async ({ page }) => {
        await page.goto(path, { waitUntil: 'load' })
        await page.waitForTimeout(300) // laisse l'hydratation appliquer la mise en page finale
        const { scrollWidth, clientWidth } = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }))
        expect(scrollWidth, `la page déborde de ${scrollWidth - clientWidth}px`).toBeLessThanOrEqual(clientWidth)
      })
    }
  })
}

test.describe('mobile', () => {
  test.use({ viewport: { width: 375, height: 800 } })

  test('les factures s’affichent en cartes et la navigation passe par le menu', async ({ page }) => {
    await page.goto('/invoices')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('table')).toBeHidden()
    await expect(page.locator('ul li a[href^="/invoices/inv_"]').first()).toBeVisible()

    await page.getByRole('button', { name: 'Ouvrir le menu' }).click()
    await page.getByRole('link', { name: 'Clients' }).click()
    await expect(page).toHaveURL(/\/clients$/)
    await expect(page.getByRole('heading', { name: 'Clients', level: 1 })).toBeVisible()
  })
})
