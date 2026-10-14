import { Download, FileText, Plus, SearchX } from 'lucide-react'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { InvoiceCardList } from '@/components/invoices/invoice-card-list'
import { InvoiceListToolbar } from '@/components/invoices/invoice-list-toolbar'
import { InvoiceRowActions } from '@/components/invoices/invoice-row-actions'
import { InvoiceStatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Pagination } from '@/components/ui/pagination'
import { getDataSource, type InvoiceSort, type InvoiceStatusFilter } from '@/lib/data'
import { getFormat } from '@/lib/i18n/server'
import { displayNumber } from '@/lib/status'
import { cn } from '@/lib/utils'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta')
  return { title: t('invoices') }
}

const STATUSES: InvoiceStatusFilter[] = ['all', 'draft', 'sent', 'paid', 'overdue', 'cancelled']
const SORTS: InvoiceSort[] = ['newest', 'oldest', 'amount_desc', 'amount_asc', 'due_soon']
const PAGE_SIZE = 10

type SearchParams = { status?: string; q?: string; sort?: string; page?: string }

export default async function InvoicesPage({ searchParams }: { searchParams: SearchParams }) {
  const status = STATUSES.includes(searchParams.status as InvoiceStatusFilter)
    ? (searchParams.status as InvoiceStatusFilter)
    : 'all'
  const sort = SORTS.includes(searchParams.sort as InvoiceSort)
    ? (searchParams.sort as InvoiceSort)
    : 'newest'
  const q = searchParams.q?.slice(0, 100) ?? ''
  const page = Math.max(1, Number.parseInt(searchParams.page ?? '1', 10) || 1)

  const [result, t, tt, tc, fmt] = await Promise.all([
    getDataSource().listInvoices({ status, sort, q, page, pageSize: PAGE_SIZE }),
    getTranslations('invoiceList'),
    getTranslations('table'),
    getTranslations('common'),
    getFormat(),
  ])

  const hrefFor = (p: number) => {
    const params = new URLSearchParams()
    if (status !== 'all') params.set('status', status)
    if (sort !== 'newest') params.set('sort', sort)
    if (q) params.set('q', q)
    if (p > 1) params.set('page', String(p))
    const qs = params.toString()
    return qs ? `/invoices?${qs}` : '/invoices'
  }

  const noInvoicesAtAll = result.counts.all === 0 && !q

  return (
    <div className="animate-fade-in space-y-5">
      <div className="page-header flex-wrap gap-3">
        <div>
          <h1 className="page-title">{t('title')}</h1>
          <p className="page-subtitle">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <a href={`/api/invoices/export?${new URLSearchParams({ status, q })}`} download>
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('export')}</span>
            </a>
          </Button>
          <Button asChild size="sm">
            <Link href="/invoices/new">
              <Plus className="h-3.5 w-3.5" /> {t('new')}
            </Link>
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        {noInvoicesAtAll ? (
          <EmptyState
            icon={<FileText className="h-6 w-6" />}
            title={t('emptyTitle')}
            description={t('emptyDescription')}
            action={
              <Button asChild>
                <Link href="/invoices/new">
                  <Plus className="h-4 w-4" /> {t('createFirst')}
                </Link>
              </Button>
            }
          />
        ) : (
          <>
            <InvoiceListToolbar status={status} sort={sort} q={q} counts={result.counts} />
            {result.rows.length === 0 ? (
              <EmptyState
                icon={<SearchX className="h-6 w-6" />}
                title={t('noResultsTitle')}
                description={t('noResultsDescription')}
              />
            ) : (
              <>
                <InvoiceCardList invoices={result.rows} withActions />
                <div className="hidden overflow-x-auto md:block">
                  <table className="table-base">
                    <thead>
                      <tr>
                        <th>{tt('number')}</th>
                        <th>{tt('client')}</th>
                        <th className="hidden lg:table-cell">{tt('issued')}</th>
                        <th className="hidden md:table-cell">{tt('due')}</th>
                        <th className="text-end">{tt('amount')}</th>
                        <th>{tt('status')}</th>
                        <th className="w-10">
                          <span className="sr-only">{tt('actions')}</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.rows.map((inv) => {
                        const partial = inv.status === 'sent' && inv.amountPaid > 0
                        return (
                          <tr key={inv.id}>
                            <td>
                              <Link
                                href={`/invoices/${inv.id}`}
                                className={cn(
                                  'text-xs font-semibold hover:underline',
                                  inv.number
                                    ? 'font-mono text-primary-600'
                                    : 'text-[var(--text-muted)]'
                                )}
                              >
                                {displayNumber(inv, tc('draft'))}
                              </Link>
                            </td>
                            <td className="max-w-[200px] truncate font-medium">{inv.clientName}</td>
                            <td className="hidden text-xs text-[var(--text-muted)] lg:table-cell">
                              {fmt.date(inv.issueDate)}
                            </td>
                            <td
                              className={cn(
                                'hidden text-xs md:table-cell',
                                inv.effectiveStatus === 'overdue'
                                  ? 'font-medium text-danger-600'
                                  : 'text-[var(--text-muted)]'
                              )}
                            >
                              {fmt.date(inv.dueDate)}
                            </td>
                            <td className="whitespace-nowrap text-end tabular-nums">
                              <span className="font-semibold">
                                {fmt.money(inv.total, inv.currency)}
                              </span>
                              {partial && (
                                <p className="text-[11px] text-[var(--text-muted)]">
                                  {tt('remaining', { amount: fmt.money(inv.total - inv.amountPaid, inv.currency) })}
                                </p>
                              )}
                            </td>
                            <td>
                              <InvoiceStatusBadge status={inv.effectiveStatus} />
                            </td>
                            <td>
                              <InvoiceRowActions invoice={inv} />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            <Pagination
              page={result.page}
              pageSize={PAGE_SIZE}
              total={result.total}
              hrefFor={hrefFor}
              itemLabel={t('itemLabel')}
            />
          </>
        )}
      </Card>
    </div>
  )
}
