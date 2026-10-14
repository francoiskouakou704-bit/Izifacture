import { addDays } from '@/lib/dates'
import { computeInvoiceTotals } from '@/lib/invoice-math'
import { toMinor } from '@/lib/money'
import { todayISO } from '@/lib/status'
import type { Invoice, Organization } from '@/lib/types'
import type { InvoiceInput } from '@/lib/validations/invoice'
import type { InvoiceRecord } from '@/lib/data/types'

/**
 * Transforme la saisie validée (unités majeures) en enregistrement persistable
 * (unités mineures) avec des totaux recalculés côté serveur.
 */
export function buildInvoiceRecord(input: InvoiceInput): InvoiceRecord {
  const { currency } = input
  const discountType = input.discountType === 'none' ? null : input.discountType
  // Remise fixe saisie en unités majeures → mineures ; remise en % inchangée.
  const discountValue =
    discountType === 'fixed' ? toMinor(input.discountValue, currency) : discountType === 'percent' ? input.discountValue : 0

  const items = input.items.map((it) => ({
    description: it.description.trim(),
    quantity: Math.round(it.quantity * 1000) / 1000, // numeric(12,3)
    unitPrice: toMinor(it.unitPrice, currency),
    taxRate: Math.round(it.taxRate * 100) / 100, // numeric(5,2)
  }))
  const totals = computeInvoiceTotals(items, discountType, discountValue)

  return {
    clientId: input.clientId,
    issueDate: input.issueDate,
    dueDate: input.dueDate,
    currency,
    discountType,
    discountValue,
    subtotal: totals.subtotal,
    taxTotal: totals.taxTotal,
    discountTotal: totals.discountTotal,
    total: totals.total,
    notes: input.notes?.trim() || undefined,
    terms: input.terms?.trim() || undefined,
    items: items.map((it, idx) => ({ ...it, ...totals.lines[idx] })),
  }
}

/** Copie d'une facture existante en nouveau brouillon daté d'aujourd'hui. */
export function duplicateRecord(source: Invoice, org: Organization): InvoiceRecord {
  const issueDate = todayISO()
  const totals = computeInvoiceTotals(source.items, source.discountType, source.discountValue)
  return {
    clientId: source.clientId,
    issueDate,
    dueDate: addDays(issueDate, org.paymentTermsDays),
    currency: source.currency,
    discountType: source.discountType,
    discountValue: source.discountValue,
    subtotal: totals.subtotal,
    taxTotal: totals.taxTotal,
    discountTotal: totals.discountTotal,
    total: totals.total,
    notes: source.notes,
    terms: source.terms,
    items: source.items.map((it, idx) => ({
      description: it.description,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      taxRate: it.taxRate,
      ...totals.lines[idx],
    })),
  }
}
