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

  test('section téléchargement : liens vers la dernière Release pour chaque système', async ({ page }) => {
    await page.goto('/#telecharger')
    const latest = 'https://github.com/francoiskouakou704-bit/Izifacture/releases/latest/download/'
    for (const [name, file] of [
      ['Télécharger pour Windows', 'iziFacture-Windows.exe'],
      ['Télécharger pour Mac', 'iziFacture-Mac.dmg'],
      ['Télécharger pour Linux', 'iziFacture-Linux.AppImage'],
    ]) {
      await expect(page.getByRole('link', { name })).toHaveAttribute('href', latest + file)
    }
    await expect(page.getByRole('link', { name: /Paquet \.deb/ })).toHaveAttribute('href', latest + 'iziFacture-Linux.deb')
    // Navigateur de test sous Windows / Linux / macOS : une carte est mise en avant
    await expect(page.getByText('Recommandé pour votre ordinateur')).toHaveCount(1)
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
