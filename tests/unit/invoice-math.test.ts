import { describe, expect, it } from 'vitest'
import { computeDiscount, computeInvoiceTotals, computeLineTotal, taxBreakdown } from '@/lib/invoice-math'

describe('computeLineTotal', () => {
  it('multiplie quantité × prix et arrondit', () => {
    expect(computeLineTotal(2, 250000)).toBe(500000)
    expect(computeLineTotal(1.5, 333)).toBe(500) // 499.5 → 500
    expect(computeLineTotal(0.333, 1000)).toBe(333)
  })
})

describe('computeDiscount', () => {
  it('pourcentage du sous-total', () => expect(computeDiscount(100000, 'percent', 10)).toBe(10000))
  it('pourcentage plafonné à 100 %', () => expect(computeDiscount(100000, 'percent', 150)).toBe(100000))
  it('montant fixe plafonné au sous-total', () => expect(computeDiscount(5000, 'fixed', 8000)).toBe(5000))
  it('aucune remise', () => {
    expect(computeDiscount(5000, null, 10)).toBe(0)
    expect(computeDiscount(5000, 'fixed', -10)).toBe(0)
  })
})

describe('computeInvoiceTotals', () => {
  it('calcule HT, TVA et TTC sans remise', () => {
    const t = computeInvoiceTotals([
      { quantity: 2, unitPrice: 250000, taxRate: 18 },
      { quantity: 1, unitPrice: 100000, taxRate: 0 },
    ])
    expect(t.subtotal).toBe(600000)
    expect(t.taxTotal).toBe(90000)
    expect(t.discountTotal).toBe(0)
    expect(t.total).toBe(690000)
    expect(t.lines).toEqual([
      { lineTotal: 500000, taxAmount: 90000 },
      { lineTotal: 100000, taxAmount: 0 },
    ])
  })

  it('la remise réduit la base taxable', () => {
    const t = computeInvoiceTotals([{ quantity: 1, unitPrice: 100000, taxRate: 18 }], 'percent', 10)
    expect(t.discountTotal).toBe(10000)
    expect(t.taxTotal).toBe(16200) // 18 % de 90 000
    expect(t.total).toBe(106200)
  })

  it('remise fixe répartie proportionnellement sur des taux différents', () => {
    const t = computeInvoiceTotals(
      [
        { quantity: 1, unitPrice: 60000, taxRate: 18 },
        { quantity: 1, unitPrice: 40000, taxRate: 10 },
      ],
      'fixed',
      20000
    )
    expect(t.subtotal).toBe(100000)
    expect(t.lines.map((l) => l.taxAmount)).toEqual([8640, 3200]) // 48 000 × 18 %, 32 000 × 10 %
    expect(t.total).toBe(100000 - 20000 + 11840)
  })

  it('total = sous-total − remise + TVA (invariant)', () => {
    const t = computeInvoiceTotals(
      [
        { quantity: 3, unitPrice: 1999, taxRate: 18 },
        { quantity: 0.5, unitPrice: 3333, taxRate: 5.5 },
      ],
      'percent',
      7
    )
    expect(t.total).toBe(t.subtotal - t.discountTotal + t.taxTotal)
    expect(Number.isInteger(t.total)).toBe(true)
  })

  it('facture vide', () => {
    expect(computeInvoiceTotals([])).toMatchObject({ subtotal: 0, taxTotal: 0, total: 0 })
  })

  it('ventile la TVA par taux', () => {
    const items = [
      { quantity: 1, unitPrice: 1000, taxRate: 18 },
      { quantity: 1, unitPrice: 2000, taxRate: 18 },
      { quantity: 1, unitPrice: 1000, taxRate: 0 },
    ]
    expect(taxBreakdown(items, computeInvoiceTotals(items))).toEqual([{ rate: 18, amount: 540 }])
  })
})
