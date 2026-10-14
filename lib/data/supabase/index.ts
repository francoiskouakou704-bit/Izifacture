import 'server-only'
import type { PostgrestError } from '@supabase/supabase-js'
import { cache } from 'react'
import { computeDashboardStats } from '@/lib/dashboard'
import { getEffectiveStatus, todayISO } from '@/lib/status'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Database, Json } from '@/lib/supabase/database.types'
import type {
  Client,
  Currency,
  CurrentUser,
  DiscountType,
  Invoice,
  InvoiceEvent,
  InvoiceItem,
  Organization,
  PartySnapshot,
  Payment,
  PaymentMethod,
  StoredInvoiceStatus,
} from '@/lib/types'
import { matchesClient, queryInvoices, withClientStats } from '../shared'
import { DomainError, type DataSource, type InvoiceRecord } from '../types'

// Implémentation Supabase du contrat DataSource.
// Lectures : requêtes directes filtrées par la RLS. Écritures sur les factures : fonctions SQL
// (save_invoice, send_invoice, add_payment…) qui garantissent atomicité et règles métier.

type Tables = Database['public']['Tables']
type OrgRow = Tables['organizations']['Row']
type ClientRow = Tables['clients']['Row']
type InvoiceRow = Tables['invoices']['Row']
type ItemRow = Tables['invoice_items']['Row']
type PaymentRow = Tables['payments']['Row']

const db = () => createSupabaseServerClient()
const opt = (v: string | null | undefined) => v ?? undefined
const nul = (v: string | undefined) => (v?.trim() ? v.trim() : null)

/** Erreurs SQL « errors.* » / « validation.* » → DomainError (message traduisible) ; le reste remonte. */
function check(error: PostgrestError | null): void {
  if (!error) return
  if (/^(errors|validation)\.[a-zA-Z]+$/.test(error.message)) throw new DomainError(error.message)
  throw new Error(`[supabase] ${error.code ?? ''} ${error.message}`)
}

function must<T>({ data, error }: { data: T; error: PostgrestError | null }): NonNullable<T> {
  check(error)
  if (data === null || data === undefined) throw new Error('[supabase] réponse vide')
  return data
}

// ─── Correspondances ligne SQL → domaine ─────────────────────────────────────

function toOrganization(r: OrgRow): Organization {
  return {
    id: r.id,
    name: r.name,
    email: opt(r.email),
    phone: opt(r.phone),
    address: opt(r.address),
    city: opt(r.city),
    country: opt(r.country),
    taxId: opt(r.tax_id),
    logoUrl: opt(r.logo_url),
    defaultCurrency: r.default_currency as Currency,
    defaultTaxRate: Number(r.default_tax_rate),
    invoicePrefix: r.invoice_prefix,
    nextInvoiceNumber: r.next_invoice_number,
    paymentTermsDays: r.payment_terms_days,
    paymentInstructions: opt(r.payment_instructions),
    footerNote: opt(r.footer_note),
  }
}

function toClient(r: ClientRow): Client {
  return {
    id: r.id,
    organizationId: r.organization_id,
    name: r.name,
    email: opt(r.email),
    phone: opt(r.phone),
    address: opt(r.address),
    city: opt(r.city),
    country: opt(r.country),
    taxId: opt(r.tax_id),
    notes: opt(r.notes),
    archivedAt: opt(r.archived_at),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toItem(r: ItemRow): InvoiceItem {
  return {
    id: r.id,
    position: r.position,
    description: r.description,
    quantity: Number(r.quantity),
    unitPrice: Number(r.unit_price),
    taxRate: Number(r.tax_rate),
    lineTotal: Number(r.line_total),
    taxAmount: Number(r.tax_amount),
  }
}

function toInvoice(r: InvoiceRow, items: ItemRow[], clientName?: string): Invoice {
  const clientSnapshot = (r.client_snapshot ?? undefined) as PartySnapshot | undefined
  const base = {
    id: r.id,
    organizationId: r.organization_id,
    clientId: r.client_id,
    clientName: clientSnapshot?.name ?? clientName ?? '—',
    number: r.number,
    status: r.status as StoredInvoiceStatus,
    issueDate: r.issue_date,
    dueDate: r.due_date,
    currency: r.currency as Currency,
    discountType: r.discount_type as DiscountType,
    discountValue: Number(r.discount_value),
    subtotal: Number(r.subtotal),
    taxTotal: Number(r.tax_total),
    discountTotal: Number(r.discount_total),
    total: Number(r.total),
    amountPaid: Number(r.amount_paid),
    notes: opt(r.notes),
    terms: opt(r.terms),
    publicToken: r.public_token,
    sentAt: opt(r.sent_at),
    paidAt: opt(r.paid_at),
    cancelledAt: opt(r.cancelled_at),
    clientSnapshot,
    companySnapshot: (r.company_snapshot ?? undefined) as PartySnapshot | undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    items: items.map(toItem).sort((a, b) => a.position - b.position),
  }
  return { ...base, effectiveStatus: getEffectiveStatus(base, todayISO()) }
}

function toPayment(r: PaymentRow): Payment {
  return {
    id: r.id,
    invoiceId: r.invoice_id,
    amount: Number(r.amount),
    paidOn: r.paid_on,
    method: r.method as PaymentMethod,
    reference: opt(r.reference),
    createdAt: r.created_at,
  }
}

function recordToJson(record: InvoiceRecord): Json {
  return {
    clientId: record.clientId,
    issueDate: record.issueDate,
    dueDate: record.dueDate,
    currency: record.currency,
    discountType: record.discountType ?? '',
    discountValue: record.discountValue,
    subtotal: record.subtotal,
    taxTotal: record.taxTotal,
    discountTotal: record.discountTotal,
    total: record.total,
    notes: record.notes ?? '',
    terms: record.terms ?? '',
    items: record.items.map((it) => ({ ...it })),
  }
}

// ─── Lectures mémoïsées par requête ──────────────────────────────────────────

const getOrgRow = cache(async (): Promise<OrgRow | null> => {
  const { data, error } = await db().from('organizations').select('*').order('created_at').limit(1).maybeSingle()
  check(error)
  return data
})

async function requireOrgRow() {
  const org = await getOrgRow()
  if (!org) throw new DomainError('errors.noOrganization')
  return org
}

/** Toutes les factures de l'organisation, sans les lignes (listes, stats, recherche). */
const loadInvoices = cache(async (): Promise<Invoice[]> => {
  const org = await getOrgRow()
  if (!org) return []
  const [invoices, clients] = await Promise.all([
    db().from('invoices').select('*').eq('organization_id', org.id),
    db().from('clients').select('id, name').eq('organization_id', org.id),
  ])
  const names = new Map(must(clients).map((c) => [c.id, c.name]))
  return must(invoices).map((r) => toInvoice(r, [], names.get(r.client_id)))
})

async function fetchInvoice(id: string): Promise<Invoice | null> {
  // Identifiant non UUID (ancien lien, saisie manuelle) : simplement introuvable.
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const { data: row, error } = await db().from('invoices').select('*').eq('id', id).maybeSingle()
  check(error)
  if (!row) return null
  const [items, client] = await Promise.all([
    db().from('invoice_items').select('*').eq('invoice_id', id),
    db().from('clients').select('name').eq('id', row.client_id).maybeSingle(),
  ])
  return toInvoice(row, must(items), client.data?.name)
}

// ─── Implémentation ──────────────────────────────────────────────────────────

export const supabaseDataSource: DataSource = {
  async getCurrentUser(): Promise<CurrentUser | null> {
    const {
      data: { user },
    } = await db().auth.getUser()
    if (!user) return null
    const { data: profile } = await db().from('profiles').select('full_name, avatar_url').eq('id', user.id).maybeSingle()
    return {
      id: user.id,
      email: user.email ?? '',
      fullName: profile?.full_name || (user.user_metadata?.full_name as string | undefined) || user.email?.split('@')[0] || '',
      avatarUrl: opt(profile?.avatar_url),
    }
  },

  // ── Organisation ──────────────────────────────────────────────
  async getOrganization() {
    const row = await getOrgRow()
    return row ? toOrganization(row) : null
  },

  async createOrganization(data) {
    const { error } = await db().rpc('create_organization', {
      p: { name: data.name, email: data.email ?? '', country: data.country ?? '', defaultCurrency: data.defaultCurrency },
    })
    check(error)
    const { data: row, error: e2 } = await db().from('organizations').select('*').order('created_at').limit(1).single()
    check(e2)
    return toOrganization(row!)
  },

  async updateOrganization(patch) {
    const org = await requireOrgRow()
    const update: Tables['organizations']['Update'] = {}
    const text = (k: keyof typeof patch, col: keyof OrgRow) => {
      if (k in patch) (update as Record<string, unknown>)[col] = nul(patch[k] as string | undefined)
    }
    if (patch.name !== undefined) update.name = patch.name.trim()
    text('email', 'email')
    text('phone', 'phone')
    text('address', 'address')
    text('city', 'city')
    text('country', 'country')
    text('taxId', 'tax_id')
    text('paymentInstructions', 'payment_instructions')
    text('footerNote', 'footer_note')
    if ('logoUrl' in patch) update.logo_url = patch.logoUrl ?? null
    if (patch.defaultCurrency) update.default_currency = patch.defaultCurrency
    if (patch.defaultTaxRate !== undefined) update.default_tax_rate = patch.defaultTaxRate
    if (patch.invoicePrefix) update.invoice_prefix = patch.invoicePrefix
    if (patch.paymentTermsDays !== undefined) update.payment_terms_days = patch.paymentTermsDays
    return toOrganization(must(await db().from('organizations').update(update).eq('id', org.id).select('*').single()))
  },

  async setLogo(file) {
    const org = await requireOrgRow()
    const bucket = db().storage.from('logos')
    // Supprime les anciens fichiers du dossier de l'organisation
    const { data: existing } = await bucket.list(org.id)
    if (existing?.length) await bucket.remove(existing.map((f) => `${org.id}/${f.name}`))

    let logoUrl: string | null = null
    if (file) {
      const ext = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/svg+xml': 'svg' }[file.mimeType] ?? 'bin'
      // Nom unique : évite le cache navigateur/CDN de l'ancien logo
      const path = `${org.id}/logo-${Date.now()}.${ext}`
      const { error } = await bucket.upload(path, file.bytes, { contentType: file.mimeType, upsert: false })
      if (error) throw new Error(`[supabase] storage ${error.message}`)
      logoUrl = bucket.getPublicUrl(path).data.publicUrl
    }
    check((await db().from('organizations').update({ logo_url: logoUrl }).eq('id', org.id)).error)
  },

  // ── Clients ───────────────────────────────────────────────────
  async listClients({ q, includeArchived } = {}) {
    const org = await getOrgRow()
    if (!org) return []
    const [rows, invoices] = await Promise.all([
      db().from('clients').select('*').eq('organization_id', org.id).order('name'),
      loadInvoices(),
    ])
    return must(rows)
      .map(toClient)
      .filter((c) => (includeArchived || !c.archivedAt) && matchesClient(c, q))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
      .map((c) => withClientStats(c, invoices))
  },

  async getClient(id) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null
    const { data, error } = await db().from('clients').select('*').eq('id', id).maybeSingle()
    check(error)
    return data ? withClientStats(toClient(data), await loadInvoices()) : null
  },

  async createClient(data) {
    const org = await requireOrgRow()
    const row = must(
      await db()
        .from('clients')
        .insert({
          organization_id: org.id,
          name: data.name.trim(),
          email: nul(data.email),
          phone: nul(data.phone),
          address: nul(data.address),
          city: nul(data.city),
          country: nul(data.country),
          tax_id: nul(data.taxId),
          notes: nul(data.notes),
        })
        .select('*')
        .single()
    )
    return toClient(row)
  },

  async updateClient(id, data) {
    const { data: row, error } = await db()
      .from('clients')
      .update({
        name: data.name.trim(),
        email: nul(data.email),
        phone: nul(data.phone),
        address: nul(data.address),
        city: nul(data.city),
        country: nul(data.country),
        tax_id: nul(data.taxId),
        notes: nul(data.notes),
      })
      .eq('id', id)
      .select('*')
      .maybeSingle()
    check(error)
    if (!row) throw new DomainError('errors.clientNotFound')
    return toClient(row)
  },

  async setClientArchived(id, archived) {
    const { data, error } = await db()
      .from('clients')
      .update({ archived_at: archived ? new Date().toISOString() : null })
      .eq('id', id)
      .select('id')
    check(error)
    if (!data?.length) throw new DomainError('errors.clientNotFound')
  },

  // ── Factures ──────────────────────────────────────────────────
  async listInvoices(params) {
    return queryInvoices(await loadInvoices(), params)
  },

  getInvoice: fetchInvoice,

  async getInvoiceByToken(token) {
    if (!/^[0-9a-f-]{36}$/i.test(token)) return null
    const { data, error } = await db().rpc('get_public_invoice', { p_token: token })
    check(error)
    if (!data) return null
    const payload = data as unknown as { invoice: InvoiceRow; items: ItemRow[]; organization: OrgRow }
    return {
      invoice: toInvoice({ ...payload.invoice, organization_id: payload.organization.id }, payload.items),
      organization: toOrganization({ ...payload.organization, next_invoice_number: 0 }),
    }
  },

  async createInvoice(record) {
    const id = must(await db().rpc('save_invoice', { p_id: null, p: recordToJson(record) }))
    return (await fetchInvoice(id))!
  },

  async updateInvoice(id, record) {
    must(await db().rpc('save_invoice', { p_id: id, p: recordToJson(record) }))
    return (await fetchInvoice(id))!
  },

  async deleteInvoice(id) {
    const { data, error } = await db().from('invoices').delete().eq('id', id).eq('status', 'draft').select('id')
    check(error)
    if (!data?.length) {
      const exists = await fetchInvoice(id)
      throw new DomainError(exists ? 'errors.onlyDraftDeletable' : 'errors.invoiceNotFound')
    }
  },

  async sendInvoice(id) {
    must(await db().rpc('send_invoice', { p_id: id }))
    return (await fetchInvoice(id))!
  },

  async cancelInvoice(id) {
    check((await db().rpc('cancel_invoice', { p_id: id })).error)
    return (await fetchInvoice(id))!
  },

  async addPayment(invoiceId, payment) {
    const id = must(
      await db().rpc('add_payment', {
        p_invoice: invoiceId,
        p_amount: payment.amount,
        p_paid_on: payment.paidOn,
        p_method: payment.method,
        p_reference: payment.reference ?? null,
      })
    )
    return toPayment(must(await db().from('payments').select('*').eq('id', id).single()))
  },

  async listPayments(invoiceId) {
    const rows = must(await db().from('payments').select('*').eq('invoice_id', invoiceId).order('paid_on', { ascending: false }))
    return rows.map(toPayment)
  },

  async listEvents(invoiceId) {
    const rows = must(
      await db().from('invoice_events').select('*').eq('invoice_id', invoiceId).order('created_at', { ascending: false })
    )
    const actorIds = Array.from(new Set(rows.map((r) => r.actor_id).filter((v): v is string => Boolean(v))))
    const names = new Map<string, string>()
    if (actorIds.length) {
      const profiles = must(await db().from('profiles').select('id, full_name').in('id', actorIds))
      for (const p of profiles) names.set(p.id, p.full_name)
    }
    return rows.map(
      (r): InvoiceEvent => ({
        id: r.id,
        invoiceId: r.invoice_id,
        type: r.type as InvoiceEvent['type'],
        actorId: opt(r.actor_id),
        actorName: r.actor_id ? names.get(r.actor_id) : undefined,
        payload: (r.payload ?? undefined) as Record<string, unknown> | undefined,
        createdAt: r.created_at,
      })
    )
  },

  async recordEvent() {
    // Les événements sont écrits par les fonctions SQL (création, envoi, paiement…).
  },

  async recordPublicView(token) {
    if (!/^[0-9a-f-]{36}$/i.test(token)) return
    check((await db().rpc('record_invoice_view', { p_token: token })).error)
  },

  // ── Statistiques ──────────────────────────────────────────────
  async getDashboardStats({ period, currency }) {
    const org = await requireOrgRow()
    // La RLS limite les paiements à ceux de l'organisation de l'utilisateur.
    const [invoices, paymentRows] = await Promise.all([loadInvoices(), db().from('payments').select('*')])
    const payments = must(paymentRows).map(toPayment)
    const defaultCurrency = org.default_currency as Currency
    return computeDashboardStats(invoices, payments, {
      period,
      currency: currency ?? defaultCurrency,
      defaultCurrency,
    })
  },
}
