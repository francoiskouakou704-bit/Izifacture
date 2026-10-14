import type {
  Client,
  Currency,
  CurrentUser,
  DashboardPeriod,
  DashboardStats,
  DiscountType,
  Invoice,
  InvoiceEvent,
  InvoiceEventType,
  InvoiceStatus,
  Organization,
  Payment,
  PaymentMethod,
} from '@/lib/types'
import type { ClientData } from '@/lib/validations/client'

// Contrat unique de persistance. Implémenté par `mock/` (phase 2) puis `supabase/` (phase 3).
// Les pages et Server Actions ne dépendent QUE de ce contrat.
// Les règles métier (validation, transitions, calculs) vivent dans lib/services, pas ici.

export interface ClientWithStats extends Client {
  invoiceCount: number
  /** Totaux par devise (hors brouillons et annulées). */
  totals: { currency: Currency; invoiced: number; outstanding: number }[]
}

export type InvoiceSort = 'newest' | 'oldest' | 'amount_desc' | 'amount_asc' | 'due_soon'
export type InvoiceStatusFilter = 'all' | InvoiceStatus

export interface ListInvoicesParams {
  status?: InvoiceStatusFilter
  q?: string
  clientId?: string
  sort?: InvoiceSort
  page?: number
  pageSize?: number
}

export interface ListInvoicesResult {
  rows: Invoice[]
  total: number
  page: number
  pageSize: number
  counts: Record<InvoiceStatusFilter, number>
}

/** Facture prête à être persistée : montants déjà calculés en unités mineures. */
export interface InvoiceRecord {
  clientId: string
  issueDate: string
  dueDate: string
  currency: Currency
  discountType: DiscountType
  discountValue: number
  subtotal: number
  taxTotal: number
  discountTotal: number
  total: number
  notes?: string
  terms?: string
  items: {
    description: string
    quantity: number
    unitPrice: number
    taxRate: number
    lineTotal: number
    taxAmount: number
  }[]
}

export interface PaymentRecord {
  amount: number
  paidOn: string
  method: PaymentMethod
  reference?: string
}

export interface DataSource {
  // Session
  getCurrentUser(): Promise<CurrentUser | null>

  // Organisation
  getOrganization(): Promise<Organization | null>
  createOrganization(data: Partial<Organization> & Pick<Organization, 'name' | 'defaultCurrency'>): Promise<Organization>
  updateOrganization(patch: Partial<Omit<Organization, 'id' | 'nextInvoiceNumber'>>): Promise<Organization>
  /** Enregistre (ou supprime avec `null`) le logo, puis met à jour `logoUrl`. Fichier déjà validé. */
  setLogo(file: { mimeType: string; bytes: Uint8Array } | null): Promise<void>

  // Clients
  listClients(params?: { q?: string; includeArchived?: boolean }): Promise<ClientWithStats[]>
  getClient(id: string): Promise<ClientWithStats | null>
  createClient(data: ClientData): Promise<Client>
  updateClient(id: string, data: ClientData): Promise<Client>
  setClientArchived(id: string, archived: boolean): Promise<void>

  // Factures
  listInvoices(params?: ListInvoicesParams): Promise<ListInvoicesResult>
  getInvoice(id: string): Promise<Invoice | null>
  getInvoiceByToken(token: string): Promise<{ invoice: Invoice; organization: Organization } | null>
  createInvoice(record: InvoiceRecord): Promise<Invoice>
  updateInvoice(id: string, record: InvoiceRecord): Promise<Invoice>
  deleteInvoice(id: string): Promise<void>
  /** Attribue le numéro (atomique), fige les coordonnées, passe en « sent ». */
  sendInvoice(id: string): Promise<Invoice>
  cancelInvoice(id: string): Promise<Invoice>
  /** Ajoute un paiement, met à jour amount_paid et passe en « paid » si soldée. */
  addPayment(invoiceId: string, payment: PaymentRecord): Promise<Payment>
  listPayments(invoiceId: string): Promise<Payment[]>
  listEvents(invoiceId: string): Promise<InvoiceEvent[]>
  recordEvent(invoiceId: string, type: InvoiceEventType, payload?: Record<string, unknown>): Promise<void>
  /** Trace la consultation du lien public par le client final (sans session). */
  recordPublicView(token: string): Promise<void>

  // Statistiques
  getDashboardStats(params: { period: DashboardPeriod; currency?: Currency }): Promise<DashboardStats>
}

/** Erreur métier ; son message est une clé de traduction (« errors.* ») affichée à l'utilisateur. */
export class DomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DomainError'
  }
}
