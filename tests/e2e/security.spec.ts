import { expect, test, type Page } from '@playwright/test'

// En-têtes de sécurité (build de production) et absence de violation de la CSP :
// une ressource bloquée par la CSP ne fait pas échouer les autres tests, seulement la console.

/** Collecte les violations de CSP signalées par le navigateur sur la page. */
async function watchCsp(page: Page) {
  const violations: string[] = []
  page.on('console', (msg) => {
    if (/Content Security Policy/i.test(msg.text())) violations.push(msg.text())
  })
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) => {
      console.error(`Content Security Policy: ${e.violatedDirective} ${e.blockedURI} @ ${location.pathname} ${e.sourceFile}:${e.lineNumber}`)
    })
  })
  return violations
}

test('en-têtes de sécurité présents, technologie non annoncée', async ({ request }) => {
  for (const path of ['/', '/login', '/dashboard']) {
    const res = await request.get(path, { maxRedirects: 0 })
    const h = res.headers()
    expect(h['content-security-policy'], path).toContain("frame-ancestors 'none'")
    expect(h['content-security-policy'], path).toContain("object-src 'none'")
    expect(h['x-frame-options'], path).toBe('DENY')
    expect(h['x-content-type-options'], path).toBe('nosniff')
    expect(h['referrer-policy'], path).toBe('strict-origin-when-cross-origin')
    expect(h['permissions-policy'], path).toContain('camera=()')
    expect(h['x-powered-by'], path).toBeUndefined()
  }
})

test('lien public de facture : ni Referer ni indexation', async ({ request }) => {
  const res = await request.get('/i/00000000-0000-0000-0000-000000000000')
  expect(res.headers()['referrer-policy']).toBe('no-referrer')
  expect(res.headers()['x-robots-tag']).toBe('noindex, nofollow')
})

test('aucune violation de CSP : landing, app et génération de PDF', async ({ page }) => {
  const violations = await watchCsp(page)

  for (const path of ['/', '/login', '/dashboard', '/invoices', '/clients', '/settings', '/invoices/new']) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
  }

  // PDF (html2canvas + jsPDF : images data:/blob:, polices)
  await page.goto('/invoices?status=paid')
  await page.waitForLoadState('networkidle')
  await page.locator('tbody a[href^="/invoices/inv_"]').first().click()
  await page.waitForURL(/\/invoices\/inv_/)
  await page.waitForLoadState('networkidle')
  await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Télécharger le PDF' }).click()])

  expect(violations).toEqual([])
})
