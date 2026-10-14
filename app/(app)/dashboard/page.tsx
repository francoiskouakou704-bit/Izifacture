import { AlertTriangle, ArrowDownRight, ArrowUpRight, CheckCircle2, ChevronRight, Clock, FileText, Plus, TrendingUp } from 'lucide-react'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { DashboardFilters } from '@/components/dashboard/dashboard-filters'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { StatusDonut } from '@/components/dashboard/status-donut'
import { InvoiceCardList } from '@/components/invoices/invoice-card-list'
import { InvoiceStatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { PERIODS } from '@/lib/dashboard'
import { getDataSource } from '@/lib/data'
import { getFormat } from '@/lib/i18n/server'
import { getCurrentUser, requireOrganization } from '@/lib/session'
import { displayNumber } from '@/lib/status'
import { CURRENCIES, type Currency, type DashboardPeriod } from '@/lib/types'
import { cn } from '@/lib/utils'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta')
  return { title: t('dashboard') }
}

function Trend({ value, vsLabel, noneLabel, format }: { value: number | null; vsLabel: string; noneLabel: string; format: (n: number) => string }) {
  if (value === null) return <span className="text-xs text-[var(--text-muted)]">{noneLabel}</span>
  const up = value >= 0
  const Icon = up ? ArrowUpRight : ArrowDownRight
  return (
    <span className="flex flex-wrap items-center gap-1">
      <Icon className={cn('h-3.5 w-3.5', up ? 'text-success-600' : 'text-danger-600')} />
      <span className={cn('text-xs font-semibold', up ? 'text-success-600' : 'text-danger-600')}>
        {up ? '+' : ''}
        {format(value)} %
      </span>
      <span className="text-xs text-[var(--text-muted)]">{vsLabel}</span>
    </span>
  )
}

export default async function DashboardPage(props: { searchParams: Promise<{ period?: string; currency?: string }> }) {
  const searchParams = await props.searchParams
  const ds = getDataSource()
  const [org, user, t, tp, tt, tc, fmt] = await Promise.all([
    requireOrganization(),
    getCurrentUser(),
    getTranslations('dashboard'),
    getTranslations('periods'),
    getTranslations('table'),
    getTranslations('common'),
    getFormat(),
  ])
  const period: DashboardPeriod = PERIODS.includes(searchParams.period as DashboardPeriod) ? (searchParams.period as DashboardPeriod) : '6m'
  const currency: Currency = CURRENCIES.some((c) => c.value === searchParams.currency) ? (searchParams.currency as Currency) : org.defaultCurrency

  const [stats, recent] = await Promise.all([
    ds.getDashboardStats({ period, currency }),
    ds.listInvoices({ sort: 'newest', pageSize: 6 }),
  ])
  const money = (n: number) => fmt.money(n, currency)
  const firstName = user?.fullName.split(' ')[0] ?? ''

  const cards = [
    {
      label: t('totalInvoices'),
      value: fmt.number(stats.totalInvoices),
      sub: stats.draftCount > 0 ? t('drafts', { count: stats.draftCount }) : undefined,
      icon: FileText,
      trend: stats.trends.count,
      color: 'text-primary-600',
      bg: 'bg-primary-50 dark:bg-primary-950/40',
    },
    {
      label: t('invoiced'),
      value: money(stats.totalInvoiced),
      icon: TrendingUp,
      trend: stats.trends.invoiced,
      color: 'text-primary-600',
      bg: 'bg-primary-50 dark:bg-primary-950/40',
    },
    {
      label: t('collected'),
      value: money(stats.totalPaid),
      icon: CheckCircle2,
      trend: stats.trends.paid,
      color: 'text-success-600',
      bg: 'bg-success-50 dark:bg-success-700/20',
    },
    {
      label: t('pending'),
      value: money(stats.totalPending),
      sub: t('pendingHint'),
      icon: Clock,
      trend: undefined,
      color: 'text-warning-600',
      bg: 'bg-warning-50 dark:bg-warning-700/20',
    },
  ]

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">{t('title')}</h1>
          <p className="page-subtitle">{t('greeting', { name: firstName })}</p>
        </div>
        <DashboardFilters period={period} currency={currency} currencies={stats.availableCurrencies} />
      </div>

      {stats.overdueCount > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-danger-100 bg-danger-50 p-4 dark:border-danger-700/40 dark:bg-danger-700/10">
          <div className="rounded-lg bg-danger-100 p-2 dark:bg-danger-700/30">
            <AlertTriangle className="h-4 w-4 text-danger-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-danger-700 dark:text-danger-500">
              {t('overdueAlert', { count: stats.overdueCount, amount: money(stats.totalOverdue) })}
            </p>
            <p className="mt-0.5 text-xs text-danger-600/80">{t('overdueHint')}</p>
          </div>
          <Button asChild variant="outline-destructive" size="sm">
            <Link href="/invoices?status=overdue">
              {t('see')} <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="stat-card">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">{card.label}</p>
                {/* Les montants passent à la ligne plutôt que d'être tronqués */}
                <p className="mt-1.5 break-words text-lg font-bold leading-tight tabular-nums text-[var(--text-primary)] 2xl:text-xl">
                  {card.value}
                </p>
              </div>
              <div className={cn('shrink-0 rounded-xl p-2.5', card.bg)}>
                <card.icon className={cn('h-5 w-5', card.color)} />
              </div>
            </div>
            <div className="mt-3 min-h-[18px]">
              {card.trend !== undefined ? (
                <Trend value={card.trend} vsLabel={t('vsPrevious')} noneLabel={t('noComparison')} format={fmt.number} />
              ) : (
                <span className="text-xs text-[var(--text-muted)]">{card.sub}</span>
              )}
              {card.trend !== undefined && card.sub && <p className="mt-0.5 text-xs text-[var(--text-muted)]">{card.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="min-w-0 xl:col-span-2">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>{t('revenueTitle')}</CardTitle>
              <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary-500" />
                  {t('chartInvoiced')}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-success-500" />
                  {t('chartCollected')}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <RevenueChart data={stats.monthlyRevenue} currency={currency} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('statusTitle')}</CardTitle>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">{tp(period)}</p>
          </CardHeader>
          <CardContent>
            <StatusDonut breakdown={stats.statusBreakdown} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('recentTitle')}</CardTitle>
            <Link href="/invoices" className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700">
              {t('seeAll')} <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </CardHeader>
        {recent.rows.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-6 w-6" />}
            title={t('emptyTitle')}
            description={t('emptyDescription')}
            action={
              <Button asChild>
                <Link href="/invoices/new">
                  <Plus className="h-4 w-4" /> {t('createInvoice')}
                </Link>
              </Button>
            }
          />
        ) : (
          <>
            <InvoiceCardList invoices={recent.rows} />
            <div className="hidden overflow-x-auto md:block">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>{tt('number')}</th>
                    <th>{tt('client')}</th>
                    <th className="hidden sm:table-cell">{tt('issued')}</th>
                    <th className="text-end">{tt('amount')}</th>
                    <th>{tt('status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.rows.map((inv) => (
                    <tr key={inv.id}>
                      <td>
                        <Link
                          href={`/invoices/${inv.id}`}
                          className={cn('text-xs font-semibold hover:underline', inv.number ? 'font-mono text-primary-600' : 'text-[var(--text-muted)]')}
                        >
                          {displayNumber(inv, tc('draft'))}
                        </Link>
                      </td>
                      <td className="max-w-[180px] truncate">{inv.clientName}</td>
                      <td className="hidden text-[var(--text-muted)] sm:table-cell">{fmt.date(inv.issueDate)}</td>
                      <td className="whitespace-nowrap text-end font-semibold tabular-nums">{fmt.money(inv.total, inv.currency)}</td>
                      <td>
                        <InvoiceStatusBadge status={inv.effectiveStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
