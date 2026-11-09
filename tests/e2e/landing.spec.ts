import { expect, test } from '@playwright/test'

test.describe('landing page', () => {
  test('présente l’offre et mène à l’inscription', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Fini les factures bricolées')
    await expect(page).toHaveTitle(/iziFacture — Facturation moderne/)

    // Lien du menu : défilement doux vers la section, l'URL prend l'ancre
    await page.getByRole('navigation', { name: 'Sections' }).getByRole('link', { name: 'FAQ' }).click()
    await expect(page).toHaveURL(/#faq$/)
    await expect(page.getByRole('heading', { name: 'Tout ce que vous devez savoir' })).toBeInViewport()

    // FAQ : une seule question ouverte à la fois
    const q1 = page.getByRole('button', { name: /assujettie à la TVA/ })
    const q2 = page.getByRole('button', { name: /XOF \(UEMOA\)/ })
    await q1.click()
    await expect(q1).toHaveAttribute('aria-expanded', 'true')
    await q2.click()
    await expect(q2).toHaveAttribute('aria-expanded', 'true')
    await expect(q1).toHaveAttribute('aria-expanded', 'false')

    await page.getByRole('main').getByRole('link', { name: 'Commencer gratuitement' }).click()
    await expect(page).toHaveURL(/\/signup$/)
    await expect(page.getByRole('tab', { name: 'Inscription' })).toHaveAttribute('aria-selected', 'true')
  })

  test('menu mobile : s’ouvre, navigue et se referme', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await page.goto('/')
    const burger = page.getByRole('button', { name: 'Menu' })
    await burger.click()
    await expect(burger).toHaveAttribute('aria-expanded', 'true')
    await page.locator('#lp-mobile-menu').getByRole('link', { name: 'Fonctionnalités' }).click()
    await expect(burger).toHaveAttribute('aria-expanded', 'false')
    await expect(page).toHaveURL(/#fonctionnalites$/)
  })
})
