import type { Currency, DashboardPeriod, DashboardStats, Invoice, InvoiceStatus, Payment } from '@/lib/types'
import { getEffectiveStatus, todayISO } from '@/lib/status'

// Calcul pur des statistiques du dashboard (testable, réutilisable côté Supabase).
// Une seule devise à la fois : additionner des XOF et des USD n'aurait aucun sens.

// Libellés : messages/*.json → « periods.<période> »
export const PERIODS: DashboardPeriod[] = ['month', '3m', '6m', 'year', 'all']

const iso = (d: Date) => todayISO(d)
const monthKey = (isoDate: string) => isoDate.slice(0, 7)

export function periodRange(period: DashboardPeriod, today: string) {
  const [y, m] = today.split('-').map(Number)
  const firstOfMonth = (year: number, month0: number) => new Date(year, month0, 1)

  let from: Date | null
  let prevFrom: Date | null = null
  switch (period) {
    case 'month':
      from = firstOfMonth(y, m - 1)
      prevFrom = firstOfMonth(y, m - 2)
      break
    case '3m': // mois courant inclus
      from = firstOfMonth(y, m - 3)
      prevFrom = firstOfMonth(y, m - 6)
      break
    case '6m':
      from = firstOfMonth(y, m - 6)
      prevFrom = firstOfMonth(y, m - 12)
      break
    case 'year':
      from = new Date(y, 0, 1)
      prevFrom = new Date(y - 1, 0, 1)
      break
    case 'all':
      from = null
  }
  // Période précédente de même longueur, à date équivalente (comparaison juste en cours de mois).
  let prevTo: string | null = null
  if (from && prevFrom) {
    const elapsedMs = new Date(y, m - 1, Number(today.slice(8, 10))).getTime() - from.getTime()
    prevTo = iso(new Date(prevFrom.getTime() + elapsedMs))
  }
  return {
    from: from ? iso(from) : null,
    to: today,
    prevFrom: prevFrom ? iso(prevFrom) : null,
    prevTo,
  }
}

function chartMonths(from: string | null, today: string, earliest: string | null): string[] {
  const [ty, tm] = today.split('-').map(Number)
  const start = from ?? earliest ?? today
  let [y, m] = start.split('-').map(Number)
  // Au moins 6 mois pour un graphique lisible, au plus 12.
  const minStart = new Date(ty, tm - 6, 1)
  if (new Date(y, m - 1, 1) > minStart) {
    y = minStart.getFullYear()
    m = minStart.getMonth() + 1
  }
  const months: string[] = []
  while (y < ty || (y === ty && m <= tm)) {
    months.push(`${y}-${String(m).padStart(2, '0')}`)
    m++
    if (m > 12) {
      m = 1
      y++
    }
  }
  return months.slice(-12)
}

const pctChange = (cur: number, prev: number) => (prev > 0 ? Math.round(((cur - prev) / prev) * 1000) / 10 : null)

export function computeDashboardStats(
  allInvoices: Invoice[],
  allPayments: Payment[],
  opts: { period: DashboardPeriod; currency: Currency; defaultCurrency: Currency; today?: string }
): DashboardStats {
  const today = opts.today ?? todayISO()
  const { period, currency } = opts
  const { from, to, prevFrom, prevTo } = periodRange(period, today)

  const invoices = allInvoices.filter((i) => i.currency === currency)
  const invoiceIds = new Set(invoices.map((i) => i.id))
  const payments = allPayments.filter((p) => invoiceIds.has(p.invoiceId))

  const within = (d: string, a: string | null, b: string | null) => (!a || d >= a) && (!b || d <= b)
  const isIssued = (i: Invoice) => i.status !== 'draft' && i.status !== 'cancelled'

  const inPeriod = invoices.filter((i) => i.status !== 'cancelled' && within(i.issueDate, from, to))
  const inPrev = prevFrom ? invoices.filter((i) => i.status !== 'cancelled' && within(i.issueDate, prevFrom, prevTo)) : []

  const sumInvoiced = (list: Invoice[]) => list.filter(isIssued).reduce((s, i) => s + i.total, 0)
  const sumPaid = (a: string | null, b: string | null) =>
    payments.filter((p) => within(p.paidOn, a, b)).reduce((s, p) => s + p.amount, 0)

  const totalInvoiced = sumInvoiced(inPeriod)
  const totalPaid = sumPaid(from, to)

  // Encours : à date, toutes périodes confondues (c'est ce qui reste à encaisser).
  let totalPending = 0
  let totalOverdue = 0
  let overdueCount = 0
  for (const inv of invoices) {
    if (inv.status !== 'sent') continue
    const due = inv.total - inv.amountPaid
    totalPending += due
    if (getEffectiveStatus(inv, today) === 'overdue') {
      totalOverdue += due
      overdueCount++
    }
  }

  const order: InvoiceStatus[] = ['paid', 'sent', 'overdue', 'draft']
  const statusBreakdown = order.map((status) => {
    const list = inPeriod.filter((i) => getEffectiveStatus(i, today) === status)
    return { status, count: list.length, total: list.reduce((s, i) => s + i.total, 0) }
  })

  const earliest = invoices.reduce<string | null>((min, i) => (!min || i.issueDate < min ? i.issueDate : min), null)
  const monthlyRevenue = chartMonths(from, today, earliest).map((key) => {
    return {
      month: key, // « 2026-10 », formaté selon la langue à l'affichage
      invoiced: invoices.filter((i) => isIssued(i) && monthKey(i.issueDate) === key).reduce((s, i) => s + i.total, 0),
      collected: payments.filter((p) => monthKey(p.paidOn) === key).reduce((s, p) => s + p.amount, 0),
    }
  })

  const currencies = new Set<Currency>([opts.defaultCurrency, ...allInvoices.map((i) => i.currency)])

  return {
    currency,
    totalInvoices: inPeriod.length,
    draftCount: inPeriod.filter((i) => i.status === 'draft').length,
    totalInvoiced,
    totalPaid,
    totalPending,
    totalOverdue,
    overdueCount,
    statusBreakdown,
    monthlyRevenue,
    trends: prevFrom
      ? {
          invoiced: pctChange(totalInvoiced, sumInvoiced(inPrev)),
          paid: pctChange(totalPaid, sumPaid(prevFrom, prevTo)),
          count: pctChange(inPeriod.length, inPrev.length),
        }
      : { invoiced: null, paid: null, count: null },
    availableCurrencies: Array.from(currencies),
  }
}
