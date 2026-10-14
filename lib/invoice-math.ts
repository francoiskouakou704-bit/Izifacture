import type { DiscountType } from '@/lib/types'

// Fonctions pures, partagées par l'aperçu live (client) et l'enregistrement (serveur).
// Le serveur recalcule TOUJOURS les totaux : on ne fait jamais confiance au client.
//
// Règle de calcul (conforme TVA) :
//   1. HT ligne        = arrondi(quantité × prix unitaire)
//   2. Sous-total HT   = Σ HT lignes
//   3. Remise          = % du sous-total, ou montant fixe (plafonné au sous-total)
//   4. TVA ligne       = arrondi(HT ligne × (1 − part de remise) × taux)
//      → la remise réduit la base taxable, proportionnellement sur chaque ligne
//   5. Total TTC       = sous-total − remise + Σ TVA

export interface LineInput {
  quantity: number
  unitPrice: number // unités mineures
  taxRate: number // pourcentage, ex. 18
}

export interface LineResult {
  lineTotal: number // HT, unités mineures
  taxAmount: number // TVA après remise, unités mineures
}

export interface InvoiceTotals {
  lines: LineResult[]
  subtotal: number
  discountTotal: number
  taxTotal: number
  total: number
}

export function computeLineTotal(quantity: number, unitPrice: number): number {
  if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice)) return 0
  return Math.round(Number((quantity * unitPrice).toFixed(6)))
}

export function computeDiscount(
  subtotal: number,
  discountType: DiscountType,
  discountValue: number // % si percent, unités mineures si fixed
): number {
  if (!discountType || !Number.isFinite(discountValue) || discountValue <= 0 || subtotal <= 0) return 0
  if (discountType === 'percent') {
    const pct = Math.min(discountValue, 100)
    return Math.round((subtotal * pct) / 100)
  }
  return Math.min(Math.round(discountValue), subtotal)
}

export function computeInvoiceTotals(
  items: LineInput[],
  discountType: DiscountType = null,
  discountValue = 0
): InvoiceTotals {
  const lineTotals = items.map((i) => computeLineTotal(i.quantity, i.unitPrice))
  const subtotal = lineTotals.reduce((s, n) => s + n, 0)
  const discountTotal = computeDiscount(subtotal, discountType, discountValue)
  const keepRatio = subtotal > 0 ? (subtotal - discountTotal) / subtotal : 0

  const lines = items.map((item, idx) => {
    const rate = Number.isFinite(item.taxRate) ? item.taxRate : 0
    const taxAmount = Math.round((lineTotals[idx] * keepRatio * rate) / 100)
    return { lineTotal: lineTotals[idx], taxAmount }
  })
  const taxTotal = lines.reduce((s, l) => s + l.taxAmount, 0)

  return {
    lines,
    subtotal,
    discountTotal,
    taxTotal,
    total: subtotal - discountTotal + taxTotal,
  }
}

/** Ventilation de la TVA par taux, pour l'affichage sur la facture. */
export function taxBreakdown(items: LineInput[], totals: InvoiceTotals) {
  const byRate = new Map<number, number>()
  items.forEach((item, idx) => {
    if (!item.taxRate) return
    byRate.set(item.taxRate, (byRate.get(item.taxRate) ?? 0) + totals.lines[idx].taxAmount)
  })
  return Array.from(byRate.entries())
    .sort(([a], [b]) => a - b)
    .map(([rate, amount]) => ({ rate, amount }))
}
