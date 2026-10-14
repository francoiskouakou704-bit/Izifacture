import { ArrowLeft, FileText, Globe, Hash, Mail, MapPin, Phone } from 'lucide-react'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ClientDetailActions } from '@/components/clients/client-detail-header'
import { InvoiceCardList } from '@/components/invoices/invoice-card-list'
import { Badge, InvoiceStatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { getDataSource } from '@/lib/data'
import { getFormat } from '@/lib/i18n/server'
import { displayNumber } from '@/lib/status'

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params
  const c = await getDataSource().getClient(params.id)
  const t = await getTranslations('meta')
  return { title: c?.name ?? t('clients') }
}

export default async function ClientDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const ds = getDataSource()
  const client = await ds.getClient(params.id)
  if (!client) notFound()
  const [{ rows: invoices }, t, tt, tc, fmt] = await Promise.all([
    ds.listInvoices({ clientId: client.id, pageSize: 100 }),
    getTranslations('clients'),
    getTranslations('table'),
    getTranslations('common'),
    getFormat(),
  ])

  const contact = [
    { icon: Mail, value: client.email },
    { icon: Phone, value: client.phone },
    { icon: MapPin, value: [client.address, client.city].filter(Boolean).join(', ') },
    { icon: Globe, value: client.country },
    { icon: Hash, value: client.taxId },
  ].filter((c) => c.value)

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex min-w-0 flex-1 items-start gap-2 sm:gap-3">
        <Button asChild variant="ghost" size="icon-sm" className="mt-1">
          <Link href="/clients" aria-label={t('back')}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 font-bold text-white">
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-xl font-bold text-[var(--text-primary)]">
                {client.name}
              </h1>
              {client.archivedAt && <Badge variant="muted">{t('archivedBadge')}</Badge>}
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              {t('since', { date: fmt.date(client.createdAt.slice(0, 10)) })}
            </p>
          </div>
        </div>
        </div>
        <ClientDetailActions client={client} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('contact')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {contact.length === 0 && (
                <p className="text-sm text-[var(--text-muted)]">{t('noContact')}</p>
              )}
              {contact.map(({ icon: Icon, value }) => (
                <p
                  key={value}
                  className="flex items-start gap-2 text-sm text-[var(--text-secondary)]"
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                  <span className="break-words">{value}</span>
                </p>
              ))}
              {client.notes && (
                <p className="mt-3 whitespace-pre-line rounded-lg bg-gray-50 p-3 text-xs text-[var(--text-muted)] dark:bg-dark-elevated">
                  {client.notes}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('summary')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)]">{t('invoices')}</span>
                <span className="font-semibold">{client.invoiceCount}</span>
              </div>
              {client.totals.map((tot) => (
                <div
                  key={tot.currency}
                  className="space-y-1.5 border-t border-[var(--border)] pt-3 text-sm"
                >
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">{t('invoicedIn', { currency: tot.currency })}</span>
                    <span className="font-semibold tabular-nums">
                      {fmt.money(tot.invoiced, tot.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">{t('outstanding')}</span>
                    <span
                      className={
                        tot.outstanding > 0
                          ? 'font-semibold tabular-nums text-warning-700'
                          : 'tabular-nums'
                      }
                    >
                      {fmt.money(tot.outstanding, tot.currency)}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="min-w-0 xl:col-span-2">
          <CardHeader>
            <CardTitle>{t('invoices')}</CardTitle>
          </CardHeader>
          {invoices.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-6 w-6" />}
              title={t('noInvoicesTitle')}
              description={t('noInvoicesDescription')}
            />
          ) : (
            <>
              <InvoiceCardList invoices={invoices} showClient={false} />
              <div className="hidden overflow-x-auto md:block">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>{tt('number')}</th>
                      <th>{tt('issued')}</th>
                      <th className="hidden sm:table-cell">{tt('due')}</th>
                      <th className="text-end">{tt('amount')}</th>
                      <th>{tt('status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id}>
                        <td>
                          <Link
                            href={`/invoices/${inv.id}`}
                            className="font-mono text-xs font-semibold text-primary-600 hover:underline"
                          >
                            {displayNumber(inv, tc('draft'))}
                          </Link>
                        </td>
                        <td className="text-xs text-[var(--text-muted)]">
                          {fmt.date(inv.issueDate)}
                        </td>
                        <td className="hidden text-xs text-[var(--text-muted)] sm:table-cell">
                          {fmt.date(inv.dueDate)}
                        </td>
                        <td className="whitespace-nowrap text-end font-semibold tabular-nums">
                          {fmt.money(inv.total, inv.currency)}
                        </td>
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
    </div>
  )
}
