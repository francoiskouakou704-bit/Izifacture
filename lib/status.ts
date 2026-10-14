import type { Invoice, InvoiceStatus, StoredInvoiceStatus } from '@/lib/types'

// Le statut « overdue » n'est jamais stocké : il est dérivé de la date d'échéance,
// ce qui le garde toujours exact sans tâche planifiée.

// Libellés : messages/*.json → « status.<statut> »

export function todayISO(now = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function getEffectiveStatus(
  invoice: Pick<Invoice, 'status' | 'dueDate' | 'amountPaid' | 'total'>,
  today = todayISO()
): InvoiceStatus {
  if (invoice.status === 'sent' && invoice.dueDate < today && invoice.amountPaid < invoice.total) {
    return 'overdue'
  }
  return invoice.status
}

const TRANSITIONS: Record<StoredInvoiceStatus, StoredInvoiceStatus[]> = {
  draft: ['sent'],
  sent: ['paid', 'cancelled'],
  paid: [],
  cancelled: [],
}

export function canTransition(from: StoredInvoiceStatus, to: StoredInvoiceStatus): boolean {
  return TRANSITIONS[from].includes(to)
}

export const isEditable = (status: StoredInvoiceStatus) => status === 'draft'
export const isDeletable = (status: StoredInvoiceStatus) => status === 'draft'
export const canRecordPayment = (inv: Pick<Invoice, 'status' | 'amountPaid' | 'total'>) =>
  inv.status === 'sent' && inv.amountPaid < inv.total

/** Numéro de facture, ou `draftLabel` (traduit par l'appelant) pour un brouillon. */
export function displayNumber(inv: Pick<Invoice, 'number'>, draftLabel = 'Brouillon'): string {
  return inv.number ?? draftLabel
}
