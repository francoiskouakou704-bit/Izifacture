import { expect, test, type Page } from '@playwright/test'

// Parcours critique : un vrai utilisateur crée, émet et encaisse une facture.
// Les montants sont vérifiés à chaque étape : c'est de l'argent réel.

const money = (s: string) => new RegExp(s.replace(/ /g, '\\s'))

/** Navigue puis attend l'hydratation (sinon la saisie peut être écrasée par React). */
async function open(page: Page, url: string) {
  await page.goto(url)
  await page.waitForLoadState('networkidle')
}

async function pickOption(page: Page, trigger: RegExp | string, option: string | RegExp) {
  await page.getByRole('combobox').filter({ hasText: trigger }).click()
  await page.getByRole('option', { name: option }).click()
}

test('créer un client, une facture multi-lignes, l’émettre et l’encaisser', async ({ page }) => {
  await open(page, '/invoices/new')
  await expect(page.getByRole('heading', { name: 'Créer une facture' })).toBeVisible()

  // Envoi sans client → erreur de validation, rien n'est créé
  await page.getByRole('button', { name: 'Envoyer la facture' }).first().click()
  await page.getByRole('button', { name: 'Émettre la facture' }).click()
  await expect(page.getByText('Sélectionnez un client').first()).toBeVisible()

  // Nouveau client depuis le formulaire
  await pickOption(page, 'Choisir un client', /Nouveau client/)
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Nom ou raison sociale *').fill('E2E Bâtiment SARL')
  await dialog.getByLabel('Email').fill('compta@e2e-batiment.sn')
  await dialog.getByRole('button', { name: 'Créer le client' }).click()
  await expect(dialog).toBeHidden()
  await expect(page.getByRole('combobox').filter({ hasText: 'E2E Bâtiment SARL' })).toBeVisible()

  // Ligne 1 : 2 × 150 000 à 18 %
  await page.getByLabel('Désignation *').first().fill('Pose de carrelage')
  await page.getByLabel('Qté *').first().fill('2')
  await page.getByLabel('Prix unitaire HT *').first().fill('150000')

  // Ligne 2 : 1 × 10 000 à 0 %
  await page.getByRole('button', { name: 'Ajouter un article' }).click()
  await page.getByLabel('Désignation *').nth(1).fill('Frais de déplacement')
  await page.getByLabel('Qté *').nth(1).fill('1')
  await page.getByLabel('Prix unitaire HT *').nth(1).fill('10000')
  await page.getByRole('combobox').filter({ hasText: '18 %' }).nth(1).click()
  await page.getByRole('option', { name: '0 %', exact: true }).click()

  // Aperçu live : HT 310 000, TVA 54 000, TTC 364 000
  const preview = page.locator('.invoice-paper')
  await expect(preview.getByText(money('310 000 F CFA'))).toBeVisible()
  await expect(preview.getByText(money('54 000 F CFA'))).toBeVisible()
  await expect(preview.getByText(money('364 000 F CFA'))).toBeVisible()

  // Remise de 10 % → HT après remise 279 000, TVA 18 % × 270 000 = 48 600, TTC 327 600
  await page.getByLabel('Ajouter une remise').check()
  await page.getByLabel('Valeur de la remise').fill('10')
  await expect(preview.getByText(money('327 600 F CFA'))).toBeVisible()

  // Émission
  await page.getByRole('button', { name: 'Envoyer la facture' }).first().click()
  await expect(page.getByRole('dialog').getByText(money('327 600 F CFA'))).toBeVisible()
  await page.getByRole('button', { name: 'Émettre la facture' }).click()
  await page.waitForURL(/\/invoices\/inv_[a-z0-9]+$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/INV-\d{4}-\d{4}/)
  await expect(page.getByText('Envoyée').first()).toBeVisible()

  // Paiement partiel de 100 000
  await page.getByRole('button', { name: 'Enregistrer un paiement' }).click()
  await page.getByLabel(/Montant reçu/).fill('100000')
  await page.getByRole('dialog').getByRole('button', { name: 'Enregistrer le paiement' }).click()
  await expect(page.getByText('Paiement partiel enregistré')).toBeVisible()
  await expect(page.getByText(money('Reste 227 600 F CFA'))).toBeVisible()

  // Un paiement supérieur au reste est refusé
  await page.getByRole('button', { name: 'Enregistrer un paiement' }).click()
  await page.getByLabel(/Montant reçu/).fill('300000')
  await page.getByRole('dialog').getByRole('button', { name: 'Enregistrer le paiement' }).click()
  await expect(page.getByText(/Maximum/)).toBeVisible()

  // Solde (montant proposé par défaut = reste à payer)
  await page.getByLabel(/Montant reçu/).fill('227600')
  await page.getByRole('dialog').getByRole('button', { name: 'Enregistrer le paiement' }).click()
  await expect(page.getByText(/facture soldée/)).toBeVisible()
  await expect(page.getByText('Payée').first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Enregistrer un paiement' })).toHaveCount(0)

  // Retrouvée dans la liste via la recherche
  await open(page, '/invoices')
  await page.getByLabel('Rechercher', { exact: true }).fill('E2E Bâtiment')
  await expect(page).toHaveURL(/q=E2E/)
  await expect(page.locator('tbody tr')).toHaveCount(1)
  await expect(page.locator('tbody tr').getByText('Payée')).toBeVisible()
})

test('un brouillon est modifiable puis supprimable', async ({ page }) => {
  await open(page, '/invoices/new')
  await pickOption(page, 'Choisir un client', 'Dakar Tech Solutions')
  await page.getByLabel('Désignation *').fill('Audit')
  await page.getByLabel('Prix unitaire HT *').fill('50000')
  await page.getByRole('button', { name: 'Enregistrer le brouillon' }).first().click()
  await page.waitForURL(/\/invoices\/inv_[a-z0-9]+$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Brouillon')

  // Modification
  await page.getByRole('link', { name: 'Modifier' }).click()
  await expect(page.getByRole('heading', { name: 'Modifier le brouillon' })).toBeVisible()
  await page.getByLabel('Prix unitaire HT *').fill('75000')
  await page.getByRole('button', { name: 'Enregistrer le brouillon' }).first().click()
  await page.waitForURL(/\/invoices\/inv_[a-z0-9]+$/)
  await expect(page.locator('.invoice-paper').getByText(money('88 500 F CFA'))).toBeVisible()

  // Suppression
  await page.getByRole('button', { name: 'Plus d’actions' }).click()
  await page.getByRole('menuitem', { name: 'Supprimer le brouillon' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Supprimer' }).click()
  await page.waitForURL('/invoices')
  await expect(page.getByText('Brouillon supprimé')).toBeVisible()
})

test('les paramètres de l’entreprise sont enregistrés et validés', async ({ page }) => {
  await open(page, '/settings')
  const name = page.getByLabel('Nom de l’entreprise *')
  await name.fill('')
  await page.getByRole('button', { name: 'Enregistrer' }).click()
  await expect(page.getByText("Nom de l'entreprise requis")).toBeVisible()

  await name.fill('Diallo Digital Services SARL')
  await page.getByRole('button', { name: 'Enregistrer' }).click()
  await expect(page.getByText('Informations enregistrées')).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('Nom de l’entreprise *')).toHaveValue('Diallo Digital Services SARL')

  // Facturation : préfixe invalide refusé
  await page.getByRole('tab', { name: 'Facturation' }).click()
  await page.getByLabel('Préfixe de numérotation').fill('FA/2026')
  await page.getByRole('button', { name: 'Enregistrer' }).click()
  await expect(page.getByText('Lettres, chiffres et tirets uniquement')).toBeVisible()
})

test('dashboard, clients et page publique s’affichent', async ({ page }) => {
  await open(page, '/dashboard')
  await expect(page.getByText('Montant facturé')).toBeVisible()
  await page.getByRole('combobox').filter({ hasText: '6 derniers mois' }).click()
  await page.getByRole('option', { name: 'Cette année' }).click()
  await expect(page).toHaveURL(/period=year/)

  await open(page, '/clients')
  await page.getByLabel('Rechercher un client…', { exact: true }).fill('Sahel')
  await expect(page).toHaveURL(/q=Sahel/)
  await expect(page.getByText('Sahel Agro SARL')).toBeVisible()
  await page.getByText('Sahel Agro SARL').click()
  await expect(page.getByRole('heading', { name: 'Sahel Agro SARL' })).toBeVisible()

  // Lien public d'une facture émise : accessible, sans la navigation de l'app
  await open(page, '/invoices?status=paid')
  await page.locator('tbody tr a').first().click()
  await page.waitForURL(/\/invoices\/inv_/)
  const res = await page.request.get(page.url())
  expect(res.ok()).toBeTruthy()
})
