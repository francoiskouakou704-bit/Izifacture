import { expect, test } from '@playwright/test'

test.describe('recherche globale', () => {
  test('trouve un client et une facture, navigation au clavier', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Raccourci clavier
    await page.keyboard.press('Control+k')
    const search = page.getByRole('combobox', { name: 'Rechercher un client ou une facture' })
    await expect(search).toBeFocused()

    await search.fill('Sahel')
    const listbox = page.getByRole('listbox')
    await expect(listbox.getByRole('option', { name: /Sahel Agro SARL/ }).first()).toBeVisible()
    await expect(listbox.getByText('Clients', { exact: true })).toBeVisible()
    await expect(listbox.getByText('Factures', { exact: true })).toBeVisible()

    // Le dernier résultat client s'ouvre au clavier
    const clientOption = listbox.getByRole('option').filter({ hasNotText: /F\sCFA|€/ }).filter({ hasText: 'Sahel Agro SARL' })
    await clientOption.hover()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/clients\/cli_5$/)
    await expect(page.getByRole('heading', { name: 'Sahel Agro SARL' })).toBeVisible()
  })

  test('recherche par numéro et état « aucun résultat »', async ({ page }) => {
    await page.goto('/invoices')
    await page.waitForLoadState('networkidle')
    const search = page.getByRole('combobox', { name: 'Rechercher un client ou une facture' })

    await search.fill('INV-2026-0040')
    await page.getByRole('listbox').getByRole('option', { name: /INV-2026-0040/ }).click()
    await expect(page).toHaveURL(/\/invoices\/inv_/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('INV-2026-0040')

    await search.fill('zzzz-introuvable')
    await expect(page.getByText('Aucun résultat pour « zzzz-introuvable »')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('listbox')).toBeHidden()
  })
})

test.describe('multilingue', () => {
  test('passer en anglais depuis les paramètres, puis revenir au français', async ({ page }) => {
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')
    await page.getByRole('tab', { name: 'Compte' }).click()
    await page.getByRole('option', { name: 'en English' }).click()

    await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')

    // La préférence persiste d'une page à l'autre (cookie)
    await page.goto('/dashboard')
    await expect(page.getByText('Amount invoiced')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Invoices' }).first()).toBeVisible()

    // Messages de validation traduits
    await page.goto('/invoices/new')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'Create an invoice' })).toBeVisible()
    await page.getByRole('button', { name: 'Send invoice' }).first().click()
    await page.getByRole('button', { name: 'Issue invoice' }).click()
    await expect(page.getByText('Select a client').first()).toBeVisible()

    // Retour au français via la barre latérale
    await page.getByRole('button', { name: /Language/ }).first().click()
    await page.getByPlaceholder('Search a language…').fill('fran')
    await page.getByRole('option', { name: /Français/ }).click()
    await expect(page.getByRole('heading', { name: 'Créer une facture' })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
  })

  test('l’arabe passe l’interface en droite-à-gauche', async ({ page }) => {
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')
    await page.getByRole('tab', { name: 'Compte' }).click()
    await page.getByPlaceholder('Rechercher une langue…').fill('arab')
    await page.getByRole('option', { name: /العربية/ }).click()
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar')

    await page.getByRole('searchbox').fill('fran')
    await page.getByRole('option', { name: /Français/ }).click()
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
  })

  test('la langue du navigateur est utilisée par défaut', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'en-US' })
    const page = await context.newPage()
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'Welcome back!' })).toBeVisible()
    await context.close()
  })
})
