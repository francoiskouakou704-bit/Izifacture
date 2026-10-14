// ─── Invoice ────────────────────────────────────────────────────────────────

/** Statuts stockés en base. */
export type StoredInvoiceStatus = 'draft' | 'sent' | 'paid' | 'cancelled'
/** Statut affiché : « overdue » est dérivé (voir lib/status.ts). */
export type InvoiceStatus = StoredInvoiceStatus | 'overdue'

export type DiscountType = 'percent' | 'fixed' | null

export type Currency = 'XOF' | 'XAF' | 'NGN' | 'GHS' | 'KES' | 'MAD' | 'GNF' | 'CDF' | 'EUR' | 'USD'

// Libellés : messages/*.json → « currencies.<code> »
export const CURRENCIES: { value: Currency; flag: string }[] = [
  { value: 'XOF', flag: '🌍' },
  { value: 'XAF', flag: '🌍' },
  { value: 'NGN', flag: '🇳🇬' },
  { value: 'GHS', flag: '🇬🇭' },
  { value: 'KES', flag: '🇰🇪' },
  { value: 'MAD', flag: '🇲🇦' },
  { value: 'GNF', flag: '🇬🇳' },
  { value: 'CDF', flag: '🇨🇩' },
  { value: 'EUR', flag: '🇪🇺' },
  { value: 'USD', flag: '🇺🇸' },
]

export const CURRENCY_DECIMALS: Record<Currency, number> = {
  XOF: 0,
  XAF: 0,
  GNF: 0,
  CDF: 0,
  NGN: 2,
  GHS: 2,
  KES: 2,
  MAD: 2,
  EUR: 2,
  USD: 2,
}

export interface InvoiceItem {
  id: string
  position: number
  description: string
  quantity: number
  unitPrice: number   // unités mineures
  taxRate: number     // ex. 18 pour 18 %
  lineTotal: number   // HT, calculé côté serveur
  taxAmount: number   // TVA après remise, calculée côté serveur
}

/** Coordonnées figées au moment de l'envoi (une facture émise ne change plus). */
export interface PartySnapshot {
  name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  country?: string
  taxId?: string
  logoUrl?: string
}

export interface Invoice {
  id: string
  organizationId: string
  clientId: string
  clientName: string
  number: string | null   // attribué à l'envoi ; null pour un brouillon
  status: StoredInvoiceStatus
  effectiveStatus: InvoiceStatus  // dérivé à la lecture
  issueDate: string    // ISO date
  dueDate: string      // ISO date
  currency: Currency
  discountType: DiscountType
  discountValue: number
  subtotal: number
  taxTotal: number
  discountTotal: number
  total: number
  amountPaid: number
  notes?: string
  terms?: string
  publicToken: string
  sentAt?: string
  paidAt?: string
  cancelledAt?: string
  clientSnapshot?: PartySnapshot
  companySnapshot?: PartySnapshot
  createdAt: string
  updatedAt: string
  items: InvoiceItem[]
}

// ─── Client ─────────────────────────────────────────────────────────────────

export interface Client {
  id: string
  organizationId: string
  name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  country?: string
  taxId?: string
  notes?: string
  archivedAt?: string
  createdAt: string
  updatedAt: string
}

// ─── Organization ────────────────────────────────────────────────────────────

export interface Organization {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  country?: string
  taxId?: string
  logoUrl?: string
  defaultCurrency: Currency
  defaultTaxRate: number
  invoicePrefix: string
  nextInvoiceNumber: number
  paymentTermsDays: number
  paymentInstructions?: string
  footerNote?: string
}

// ─── Dashboard Stats ─────────────────────────────────────────────────────────

export interface MonthlyRevenue {
  month: string   // clé « YYYY-MM »
  invoiced: number
  collected: number
}

export interface DashboardStats {
  currency: Currency
  totalInvoices: number
  draftCount: number
  totalInvoiced: number
  totalPaid: number
  totalPending: number
  totalOverdue: number
  overdueCount: number
  statusBreakdown: { status: InvoiceStatus; count: number; total: number }[]
  monthlyRevenue: MonthlyRevenue[]
  /** Variation vs période précédente, en % (null si non calculable). */
  trends: { invoiced: number | null; paid: number | null; count: number | null }
  /** Devises présentes dans les factures de l'organisation. */
  availableCurrencies: Currency[]
}

export type DashboardPeriod = 'month' | '3m' | '6m' | 'year' | 'all'

// ─── Events ──────────────────────────────────────────────────────────────────

export type InvoiceEventType = 'created' | 'updated' | 'sent' | 'viewed' | 'payment' | 'cancelled'

export interface InvoiceEvent {
  id: string
  invoiceId: string
  type: InvoiceEventType
  actorId?: string
  actorName?: string
  payload?: Record<string, unknown>
  createdAt: string
}

// ─── Payment ─────────────────────────────────────────────────────────────────

export type PaymentMethod = 'bank' | 'mobile_money' | 'cash' | 'card' | 'other'

// Libellés : messages/*.json → « paymentMethods.<moyen> »
export const PAYMENT_METHODS: PaymentMethod[] = ['mobile_money', 'bank', 'cash', 'card', 'other']

export interface Payment {
  id: string
  invoiceId: string
  amount: number   // unités mineures
  paidOn: string   // ISO date
  method: PaymentMethod
  reference?: string
  createdAt: string
}

// ─── User ────────────────────────────────────────────────────────────────────

export interface CurrentUser {
  id: string
  fullName: string
  email: string
  avatarUrl?: string
}
