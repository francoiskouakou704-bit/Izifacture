import 'server-only'
import { computeDashboardStats } from '@/lib/dashboard'
import { getEffectiveStatus, todayISO } from '@/lib/status'
import type { Client, Invoice, InvoiceEvent, Organization, Payment } from '@/lib/types'
import { matchesClient, queryInvoices, withClientStats } from '../shared'
import { DomainError, type ClientWithStats, type DataSource, type InvoiceRecord } from '../types'
import { createSeed, toSnapshot, type MockDb } from './seed'

// Base en mémoire, conservée sur globalThis pour survivre au hot-reload de `next dev`.
// Réinitialisée au redémarrage du serveur. Remplacée par Supabase en phase 3.
const g = globalThis as unknown as { __iziMockDb?: MockDb }
function db(): MockDb {
  if (!g.__iziMockDb) g.__iziMockDb = createSeed()
  return g.__iziMockDb
}

/** Réinitialise la base (tests). */
export function resetMockDb(seed?: MockDb) {
  g.__iziMockDb = seed ?? createSeed()
}

const uid = (prefix: string) => `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`
const nowISO = () => new Date().toISOString()
const clone = <T,>(v: T): T => structuredClone(v)

function requireOrg(): Organization {
  const org = db().organization
  if (!org) throw new DomainError('errors.noOrganization')
  return org
}

function hydrate(inv: MockDb['invoices'][number]): Invoice {
  const client = db().clients.find((c) => c.id === inv.clientId)
  return clone({
    ...inv,
    clientName: inv.clientSnapshot?.name ?? client?.name ?? 'Client supprimé',
    effectiveStatus: getEffectiveStatus(inv, todayISO()),
  })
}

function findInvoice(id: string) {
  const inv = db().invoices.find((i) => i.id === id)
  if (!inv) throw new DomainError('errors.invoiceNotFound')
  return inv
}

function event(invoiceId: string, type: InvoiceEvent['type'], payload?: Record<string, unknown>) {
  const d = db()
  d.events.push({ id: uid('evt'), invoiceId, type, actorId: d.user.id, actorName: d.user.fullName, payload, createdAt: nowISO() })
}

function clientStats(client: Client): ClientWithStats {
  return clone(withClientStats(client, db().invoices))
}

function applyRecord(target: MockDb['invoices'][number], record: InvoiceRecord) {
  const { items, ...rest } = record
  Object.assign(target, rest, {
    items: items.map((it, idx) => ({ ...it, id: uid('itm'), position: idx })),
    updatedAt: nowISO(),
  })
}

export const mockDataSource: DataSource = {
  async getCurrentUser() {
    return clone(db().user)
  },

  // ── Organisation ──────────────────────────────────────────────
  async getOrganization() {
    const org = db().organization
    return org ? clone(org) : null
  },

  async createOrganization(data) {
    const org: Organization = {
      defaultTaxRate: 18,
      invoicePrefix: 'INV',
      paymentTermsDays: 30,
      ...data,
      id: uid('org'),
      nextInvoiceNumber: 1,
    }
    db().organization = org
    return clone(org)
  },

  async updateOrganization(patch) {
    const org = requireOrg()
    Object.assign(org, patch)
    return clone(org)
  },

  async setLogo(file) {
    // Mode local : le logo est conservé en data URL.
    const org = requireOrg()
    org.logoUrl = file ? `data:${file.mimeType};base64,${Buffer.from(file.bytes).toString('base64')}` : undefined
  },

  // ── Clients ───────────────────────────────────────────────────
  async listClients({ q, includeArchived } = {}) {
    return db()
      .clients.filter((c) => (includeArchived || !c.archivedAt) && matchesClient(c, q))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
      .map(clientStats)
  },

  async getClient(id) {
    const c = db().clients.find((x) => x.id === id)
    return c ? clientStats(c) : null
  },

  async createClient(data) {
    const org = requireOrg()
    const client: Client = { ...data, id: uid('cli'), organizationId: org.id, createdAt: nowISO(), updatedAt: nowISO() }
    db().clients.push(client)
    return clone(client)
  },

  async updateClient(id, data) {
    const c = db().clients.find((x) => x.id === id)
    if (!c) throw new DomainError('errors.clientNotFound')
    // Clés explicites : un champ vidé doit disparaître
    Object.assign(c, {
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      country: data.country,
      taxId: data.taxId,
      notes: data.notes,
      updatedAt: nowISO(),
    })
    return clone(c)
  },

  async setClientArchived(id, archived) {
    const c = db().clients.find((x) => x.id === id)
    if (!c) throw new DomainError('errors.clientNotFound')
    c.archivedAt = archived ? nowISO() : undefined
  },

  // ── Factures ──────────────────────────────────────────────────
  async listInvoices(params) {
    return queryInvoices(db().invoices.map(hydrate), params)
  },

  async getInvoice(id) {
    const inv = db().invoices.find((i) => i.id === id)
    return inv ? hydrate(inv) : null
  },

  async getInvoiceByToken(token) {
    const inv = db().invoices.find((i) => i.publicToken === token && i.status !== 'draft')
    const org = db().organization
    return inv && org ? { invoice: hydrate(inv), organization: clone(org) } : null
  },

  async createInvoice(record) {
    const org = requireOrg()
    const id = uid('inv')
    const inv = {
      id,
      organizationId: org.id,
      number: null,
      status: 'draft',
      amountPaid: 0,
      publicToken: crypto.randomUUID(),
      createdAt: nowISO(),
    } as MockDb['invoices'][number]
    applyRecord(inv, record)
    db().invoices.push(inv)
    event(id, 'created')
    return hydrate(inv)
  },

  async updateInvoice(id, record) {
    const inv = findInvoice(id)
    if (inv.status !== 'draft') throw new DomainError('errors.onlyDraftEditable')
    applyRecord(inv, record)
    event(id, 'updated')
    return hydrate(inv)
  },

  async deleteInvoice(id) {
    const d = db()
    const inv = findInvoice(id)
    if (inv.status !== 'draft') throw new DomainError('errors.onlyDraftDeletable')
    d.invoices = d.invoices.filter((i) => i.id !== id)
    d.events = d.events.filter((e) => e.invoiceId !== id)
  },

  async sendInvoice(id) {
    const org = requireOrg()
    const inv = findInvoice(id)
    if (inv.status !== 'draft') throw new DomainError('errors.alreadySent')
    const client = db().clients.find((c) => c.id === inv.clientId)
    if (!client) throw new DomainError('errors.clientNotFound')
    // Numérotation séquentielle sans trou (en base : UPDATE … RETURNING atomique)
    const seq = org.nextInvoiceNumber++
    inv.number = `${org.invoicePrefix}-${inv.issueDate.slice(0, 4)}-${String(seq).padStart(4, '0')}`
    inv.status = 'sent'
    inv.sentAt = nowISO()
    inv.updatedAt = nowISO()
    inv.clientSnapshot = toSnapshot(client)
    inv.companySnapshot = toSnapshot(org)
    event(id, 'sent', { number: inv.number })
    return hydrate(inv)
  },

  async cancelInvoice(id) {
    const inv = findInvoice(id)
    if (inv.status !== 'sent') throw new DomainError('errors.onlySentCancellable')
    inv.status = 'cancelled'
    inv.cancelledAt = nowISO()
    inv.updatedAt = nowISO()
    event(id, 'cancelled')
    return hydrate(inv)
  },

  async addPayment(invoiceId, record) {
    const inv = findInvoice(invoiceId)
    if (inv.status !== 'sent') throw new DomainError('errors.notAwaitingPayment')
    if (record.amount <= 0 || inv.amountPaid + record.amount > inv.total) {
      throw new DomainError('errors.paymentExceedsBalance')
    }
    const payment: Payment = { ...record, id: uid('pay'), invoiceId, createdAt: nowISO() }
    db().payments.push(payment)
    inv.amountPaid += record.amount
    if (inv.amountPaid >= inv.total) {
      inv.status = 'paid'
      inv.paidAt = nowISO()
    }
    inv.updatedAt = nowISO()
    event(invoiceId, 'payment', { amount: record.amount, method: record.method })
    return clone(payment)
  },

  async listPayments(invoiceId) {
    return clone(db().payments.filter((p) => p.invoiceId === invoiceId).sort((a, b) => b.paidOn.localeCompare(a.paidOn)))
  },

  async listEvents(invoiceId) {
    return clone(db().events.filter((e) => e.invoiceId === invoiceId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
  },

  async recordEvent(invoiceId, type, payload) {
    findInvoice(invoiceId)
    if (type === 'viewed') {
      // Pas d'actor : c'est le client final qui consulte
      db().events.push({ id: uid('evt'), invoiceId, type, payload, createdAt: nowISO() })
      return
    }
    event(invoiceId, type, payload)
  },

  async recordPublicView(token) {
    const inv = db().invoices.find((i) => i.publicToken === token && i.status !== 'draft')
    if (!inv || db().events.some((e) => e.invoiceId === inv.id && e.type === 'viewed')) return
    db().events.push({ id: uid('evt'), invoiceId: inv.id, type: 'viewed', createdAt: nowISO() })
  },

  // ── Statistiques ──────────────────────────────────────────────
  async getDashboardStats({ period, currency }) {
    const org = requireOrg()
    const d = db()
    return computeDashboardStats(d.invoices.map(hydrate), d.payments, {
      period,
      currency: currency ?? org.defaultCurrency,
      defaultCurrency: org.defaultCurrency,
    })
  },
}
