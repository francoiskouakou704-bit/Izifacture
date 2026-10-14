import type { Client, Currency, Invoice } from '@/lib/types'
import type { ClientWithStats, InvoiceStatusFilter, ListInvoicesParams, ListInvoicesResult } from './types'

// Logique de lecture commune aux implémentations (mock et Supabase) :
// filtres, tri, pagination et compteurs reposent sur le statut effectif (« overdue » dérivé).

const SORTERS: Record<string, (a: Invoice, b: Invoice) => number> = {
  newest: (a, b) => b.issueDate.localeCompare(a.issueDate) || b.createdAt.localeCompare(a.createdAt),
  oldest: (a, b) => a.issueDate.localeCompare(b.issueDate) || a.createdAt.localeCompare(b.createdAt),
  amount_desc: (a, b) => b.total - a.total,
  amount_asc: (a, b) => a.total - b.total,
  due_soon: (a, b) => a.dueDate.localeCompare(b.dueDate),
}

export function queryInvoices(
  invoices: Invoice[],
  { status = 'all', q, clientId, sort = 'newest', page = 1, pageSize = 10 }: ListInvoicesParams = {}
): ListInvoicesResult {
  const needle = q?.trim().toLowerCase()
  const base = invoices
    .filter((i) => !clientId || i.clientId === clientId)
    .filter((i) => !needle || i.clientName.toLowerCase().includes(needle) || i.number?.toLowerCase().includes(needle))

  const counts = { all: base.length, draft: 0, sent: 0, paid: 0, overdue: 0, cancelled: 0 } as Record<InvoiceStatusFilter, number>
  for (const i of base) counts[i.effectiveStatus]++

  // « Envoyées » inclut les factures en retard (elles sont envoyées et non payées).
  const filtered = base.filter(
    (i) => status === 'all' || i.effectiveStatus === status || (status === 'sent' && i.effectiveStatus === 'overdue')
  )
  counts.sent += counts.overdue
  filtered.sort(SORTERS[sort] ?? SORTERS.newest)

  const safePage = Math.max(1, page)
  return {
    rows: filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    total: filtered.length,
    page: safePage,
    pageSize,
    counts,
  }
}

/** Nombre de factures et totaux par devise (hors brouillons et annulées). */
export function withClientStats(client: Client, invoices: Pick<Invoice, 'clientId' | 'status' | 'currency' | 'total' | 'amountPaid'>[]): ClientWithStats {
  const invs = invoices.filter((i) => i.clientId === client.id)
  const totals = new Map<Currency, { invoiced: number; outstanding: number }>()
  for (const i of invs) {
    if (i.status === 'draft' || i.status === 'cancelled') continue
    const t = totals.get(i.currency) ?? { invoiced: 0, outstanding: 0 }
    t.invoiced += i.total
    if (i.status === 'sent') t.outstanding += i.total - i.amountPaid
    totals.set(i.currency, t)
  }
  return {
    ...client,
    invoiceCount: invs.length,
    totals: Array.from(totals, ([currency, t]) => ({ currency, ...t })),
  }
}

export function matchesClient(c: Client, q?: string) {
  const needle = q?.trim().toLowerCase()
  return !needle || [c.name, c.email, c.phone, c.city, c.country].some((f) => f?.toLowerCase().includes(needle))
}
