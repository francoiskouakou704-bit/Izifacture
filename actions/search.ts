'use server'

import { getDataSource } from '@/lib/data'
import type { Currency, InvoiceStatus } from '@/lib/types'

export interface SearchResults {
  invoices: { id: string; number: string | null; clientName: string; total: number; currency: Currency; status: InvoiceStatus }[]
  invoiceTotal: number
  clients: { id: string; name: string; location?: string; email?: string }[]
}

const EMPTY: SearchResults = { invoices: [], invoiceTotal: 0, clients: [] }

/** Recherche globale (barre du haut) : factures par numéro ou client, clients par nom/contact. */
export async function globalSearchAction(rawQuery: string): Promise<SearchResults> {
  const q = String(rawQuery ?? '').trim().slice(0, 100)
  if (q.length < 2) return EMPTY

  const ds = getDataSource()
  const [invoices, clients] = await Promise.all([ds.listInvoices({ q, sort: 'newest', pageSize: 5 }), ds.listClients({ q })])

  return {
    invoices: invoices.rows.map((i) => ({
      id: i.id,
      number: i.number,
      clientName: i.clientName,
      total: i.total,
      currency: i.currency,
      status: i.effectiveStatus,
    })),
    invoiceTotal: invoices.total,
    clients: clients.slice(0, 5).map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      location: [c.city, c.country].filter(Boolean).join(', ') || undefined,
    })),
  }
}
