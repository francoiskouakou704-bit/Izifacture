import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'

// Téléchargement de la facture en PDF (détail et lien public envoyé au client).

test('télécharger une facture émise en PDF, depuis le détail puis le lien public', async ({ page }) => {
  await page.goto('/invoices?status=paid')
  await page.waitForLoadState('networkidle')
  await page.locator('tbody a[href^="/invoices/inv_"]').first().click()
  await page.waitForURL(/\/invoices\/inv_/)
  await page.waitForLoadState('networkidle')
  const number = (await page.getByRole('heading', { level: 1 }).innerText()).trim()

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Télécharger le PDF' }).click(),
  ])
  expect(download.suggestedFilename()).toBe(`${number}.pdf`)
  const bytes = await readFile((await download.path())!)
  expect(bytes.subarray(0, 5).toString()).toBe('%PDF-')
  expect(bytes.byteLength).toBeGreaterThan(20_000) // contient bien l'image de la facture

  // Lien public (client final, sans compte)
  await page.evaluate(() => {
    window.open = ((url: string) => {
      ;(window as unknown as { __opened: string }).__opened = url
      return null
    }) as typeof window.open
  })
  await page.getByRole('button', { name: 'Partager' }).click()
  await page.getByRole('menuitem', { name: /WhatsApp/ }).click()
  const shared = decodeURIComponent(await page.evaluate(() => (window as unknown as { __opened: string }).__opened))
  const publicPath = /\/i\/[^\s%]+/.exec(shared)![0]

  await page.goto(publicPath)
  await page.waitForLoadState('networkidle')
  const [publicDownload] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Télécharger le PDF' }).click(),
  ])
  expect(publicDownload.suggestedFilename()).toBe(`${number}.pdf`)
})
