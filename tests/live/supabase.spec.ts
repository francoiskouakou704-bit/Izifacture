import { expect, test, type Page } from '@playwright/test'

// Parcours complet contre la VRAIE base Supabase (pas de données locales).
// Lancé uniquement avec des comptes de test dédiés :
//   LIVE_EMAIL_A, LIVE_EMAIL_B, LIVE_PASSWORD, LIVE_BASE_URL  →  npm run test:live
// Le compte A ne doit pas encore avoir d'entreprise.

const A = process.env.LIVE_EMAIL_A ?? ''
const B = process.env.LIVE_EMAIL_B ?? ''
const PASSWORD = process.env.LIVE_PASSWORD ?? ''
const money = (s: string) => new RegExp(s.replace(/ /g, '\\s'))

test.skip(!A || !B || !PASSWORD, 'Comptes de test LIVE_* non fournis')
test.describe.configure({ mode: 'serial' })

async function open(page: Page, url: string) {
  await page.goto(url)
  await page.waitForLoadState('networkidle')
}

async function login(page: Page, email: string) {
  await open(page, '/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Mot de passe').fill(PASSWORD)
  await page.getByRole('button', { name: 'Se connecter' }).click()
}

let invoiceUrl = ''
let publicUrl = ''

test('A : sans session → connexion, entreprise, logo, client, facture, paiements', async ({ page }) => {
  test.setTimeout(180_000)

  // Les pages sont protégées
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/)

  // Mauvais mot de passe → message clair
  await page.getByLabel('Email').fill(A)
  await page.getByLabel('Mot de passe').fill('mauvais-mot-de-passe-1')
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await expect(page.getByText('E-mail ou mot de passe incorrect.')).toBeVisible()

  // Connexion → onboarding (pas encore d'entreprise)
  await login(page, A)
  await page.waitForURL(/\/onboarding/)
  await page.getByLabel(/Nom de l’entreprise/).fill('Test Live SARL')
  await page.getByRole('button', { name: /Commencer à facturer/ }).click()
  await page.waitForURL(/\/dashboard/)
  await expect(page.getByText('Test Live SARL').first()).toBeVisible()

  // Logo → Supabase Storage
  await open(page, '/settings')
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  )
  await page.locator('input[type="file"]').setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: png })
  await expect(page.getByText('Logo mis à jour')).toBeVisible({ timeout: 20_000 })
  await expect(page.locator('img[src*="supabase.co/storage"]').first()).toBeVisible()

  // Facture : nouveau client + 2 lignes + remise
  await open(page, '/invoices/new')
  await page.getByRole('combobox').filter({ hasText: 'Choisir un client' }).click()
  await page.getByRole('option', { name: /Nouveau client/ }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Nom ou raison sociale *').fill('Client Live SA')
  await dialog.getByLabel('Email').fill('compta@client-live.test')
  await dialog.getByRole('button', { name: 'Créer le client' }).click()
  await expect(dialog).toBeHidden()

  await page.getByLabel('Désignation *').first().fill('Pose de carrelage')
  await page.getByLabel('Qté *').first().fill('2')
  await page.getByLabel('Prix unitaire HT *').first().fill('150000')
  await page.getByRole('button', { name: 'Ajouter un article' }).click()
  await page.getByLabel('Désignation *').nth(1).fill('Frais de déplacement')
  await page.getByLabel('Prix unitaire HT *').nth(1).fill('10000')
  await page.getByRole('combobox').filter({ hasText: '18 %' }).nth(1).click()
  await page.getByRole('option', { name: '0 %', exact: true }).click()
  await page.getByLabel('Ajouter une remise').check()
  await page.getByLabel('Valeur de la remise').fill('10')
  await expect(page.locator('.invoice-paper').getByText(money('327 600 F CFA'))).toBeVisible()

  // Brouillon enregistré en base, puis émission (numéro attribué par la base)
  await page.getByRole('button', { name: 'Enregistrer le brouillon' }).first().click()
  await page.waitForURL(/\/invoices\/[0-9a-f-]{36}$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Brouillon')
  invoiceUrl = page.url()

  await page.getByRole('button', { name: 'Émettre la facture' }).first().click()
  await page.getByRole('dialog').getByRole('button', { name: 'Émettre' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/INV-\d{4}-0001/)
  await expect(page.locator('.invoice-paper').getByText(money('327 600 F CFA')).first()).toBeVisible()

  // Paiement partiel, refus d'un trop-perçu, solde
  await page.getByRole('button', { name: 'Enregistrer un paiement' }).click()
  await page.getByLabel(/Montant reçu/).fill('100000')
  await page.getByRole('dialog').getByRole('button', { name: 'Enregistrer le paiement' }).click()
  await expect(page.getByText('Paiement partiel enregistré')).toBeVisible()
  await expect(page.getByText(money('Reste 227 600 F CFA'))).toBeVisible()

  await page.getByRole('button', { name: 'Enregistrer un paiement' }).click()
  await page.getByLabel(/Montant reçu/).fill('227600')
  await page.getByRole('dialog').getByRole('button', { name: 'Enregistrer le paiement' }).click()
  await expect(page.getByText(/facture soldée/)).toBeVisible()
  await expect(page.getByText('Payée').first()).toBeVisible()

  // Historique écrit par la base
  await expect(page.getByText('Paiement reçu').first()).toBeVisible()

  // Lien public : celui envoyé au client (menu Partager › WhatsApp)
  await page.evaluate(() => {
    window.open = ((url: string) => {
      ;(window as unknown as { __opened: string }).__opened = url
      return null
    }) as typeof window.open
  })
  await page.getByRole('button', { name: 'Partager' }).click()
  await page.getByRole('menuitem', { name: /WhatsApp/ }).click()
  const wa = await page.evaluate(() => (window as unknown as { __opened: string }).__opened)
  publicUrl = /\/i\/[0-9a-f-]{36}/.exec(decodeURIComponent(wa))?.[0] ?? ''
  expect(publicUrl).toMatch(/^\/i\/[0-9a-f-]{36}$/)

  // Tableau de bord
  await open(page, '/dashboard')
  await expect(page.getByText(money('327 600')).first()).toBeVisible()

  // Déconnexion
  await page.getByRole('button', { name: 'Se déconnecter' }).first().click()
  await page.waitForURL(/\/login/)
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login/)
})

test('lien public : lisible sans compte, brouillons et jetons inconnus introuvables', async ({ page }) => {
  expect(publicUrl).not.toBe('')
  await open(page, publicUrl)
  await expect(page.getByText(/INV-\d{4}-0001/).first()).toBeVisible()
  await expect(page.getByText('Client Live SA').first()).toBeVisible()

  const res = await page.goto('/i/00000000-0000-4000-8000-000000000000')
  expect(res?.status()).toBe(404)
})

test('B : isolation — un autre compte ne voit rien des données de A', async ({ page }) => {
  await login(page, B)
  await page.waitForURL(/\/onboarding/)
  await page.getByLabel(/Nom de l’entreprise/).fill('Autre Entreprise B')
  await page.getByRole('button', { name: /Commencer à facturer/ }).click()
  await page.waitForURL(/\/dashboard/)

  await open(page, '/invoices')
  await expect(page.getByText('Client Live SA')).toHaveCount(0)
  await open(page, '/clients')
  await expect(page.getByText('Client Live SA')).toHaveCount(0)

  // Accès direct à la facture de A → introuvable, aucune donnée affichée
  // (code HTTP 200 possible : la page est diffusée en streaming avant le notFound)
  await open(page, new URL(invoiceUrl).pathname)
  await expect(page.getByRole('heading', { name: 'Page introuvable' })).toBeVisible()
  await expect(page.getByText('Client Live SA')).toHaveCount(0)
  await expect(page.getByText(/INV-\d{4}-0001/)).toHaveCount(0)
})
