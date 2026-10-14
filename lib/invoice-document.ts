import { taxBreakdown } from '@/lib/invoice-math'
import type { Currency, DiscountType, Invoice, InvoiceStatus, Organization, PartySnapshot } from '@/lib/types'

/** Données d'affichage d'une facture, communes à l'aperçu live, au détail et à la page publique. */
export interface InvoiceDocumentData {
  number: string | null
  status?: InvoiceStatus
  issueDate: string
  dueDate: string
  currency: Currency
  company: PartySnapshot
  client: PartySnapshot | null
  items: { description: string; quantity: number; unitPrice: number; taxRate: number; lineTotal: number }[]
  subtotal: number
  discountType: DiscountType
  discountValue: number
  discountTotal: number
  taxes: { rate: number; amount: number }[]
  total: number
  amountPaid: number
  notes?: string
  paymentInstructions?: string
  footerNote?: string
}

export function orgToSnapshot(org: Organization): PartySnapshot {
  return {
    name: org.name,
    email: org.email,
    phone: org.phone,
    address: org.address,
    city: org.city,
    country: org.country,
    taxId: org.taxId,
    logoUrl: org.logoUrl,
  }
}

/**
 * Une facture émise utilise ses coordonnées figées ; un brouillon utilise les données actuelles.
 * Le logo et les instructions de paiement restent ceux de l'entreprise (pas de valeur légale).
 */
export function invoiceToDocument(
  invoice: Invoice,
  org: Organization,
  liveClient?: PartySnapshot | null
): InvoiceDocumentData {
  return {
    number: invoice.number,
    status: invoice.effectiveStatus,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    currency: invoice.currency,
    company: { ...(invoice.companySnapshot ?? orgToSnapshot(org)), logoUrl: org.logoUrl },
    client: invoice.clientSnapshot ?? liveClient ?? { name: invoice.clientName },
    items: invoice.items,
    subtotal: invoice.subtotal,
    discountType: invoice.discountType,
    discountValue: invoice.discountValue,
    discountTotal: invoice.discountTotal,
    taxes: taxBreakdown(invoice.items, {
      lines: invoice.items.map((i) => ({ lineTotal: i.lineTotal, taxAmount: i.taxAmount })),
      subtotal: invoice.subtotal,
      discountTotal: invoice.discountTotal,
      taxTotal: invoice.taxTotal,
      total: invoice.total,
    }),
    total: invoice.total,
    amountPaid: invoice.amountPaid,
    notes: invoice.notes,
    paymentInstructions: org.paymentInstructions,
    footerNote: org.footerNote,
  }
}
