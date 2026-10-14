import { ArrowLeft, Ban, CheckCircle2, CreditCard, Eye, FilePlus2, History, PencilLine, Send } from 'lucide-react'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { InvoiceActions } from '@/components/invoices/invoice-actions'
import { InvoiceDocument } from '@/components/invoices/invoice-document'
import { InvoiceStatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getDataSource } from '@/lib/data'
import { daysBetween } from '@/lib/dates'
import { getFormat } from '@/lib/i18n/server'
import { invoiceToDocument } from '@/lib/invoice-document'
import { requireOrganization } from '@/lib/session'
import { displayNumber, todayISO } from '@/lib/status'
import type { InvoiceEventType } from '@/lib/types'
import { cn } from '@/lib/utils'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const [inv, t, tc] = await Promise.all([getDataSource().getInvoice(params.id), getTranslations('meta'), getTranslations('common')])
  return { title: t('invoice', { number: inv ? displayNumber(inv, tc('draft')) : '' }) }
}

const EVENT_META: Record<InvoiceEventType, { icon: typeof Send; color: string }> = {
  created: { icon: FilePlus2, color: 'text-[var(--text-muted)]' },
  updated: { icon: PencilLine, color: 'text-[var(--text-muted)]' },
  sent: { icon: Send, color: 'text-primary-600' },
  viewed: { icon: Eye, color: 'text-primary-400' },
  payment: { icon: CreditCard, color: 'text-success-600' },
  cancelled: { icon: Ban, color: 'text-danger-600' },
}

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const ds = getDataSource()
  const [org, invoice] = await Promise.all([requireOrganization(), ds.getInvoice(params.id)])
  if (!invoice) notFound()

  const [client, payments, events, t, tc, tm, fmt] = await Promise.all([
    ds.getClient(invoice.clientId),
    ds.listPayments(invoice.id),
    ds.listEvents(invoice.id),
    getTranslations('invoiceDetail'),
    getTranslations('common'),
    getTranslations('paymentMethods'),
    getFormat(),
  ])
  const doc = invoiceToDocument(invoice, org, client)
  const money = (n: number) => fmt.money(n, invoice.currency)
  const remaining = invoice.total - invoice.amountPaid
  const progress = invoice.total > 0 ? Math.min(100, (invoice.amountPaid / invoice.total) * 100) : 0
  const today = todayISO()
  const daysToDue = daysBetween(today, invoice.dueDate)

  return (
    <div className="animate-fade-in space-y-5">
      <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex min-w-0 flex-1 items-start gap-2 sm:gap-3">
        <Button asChild variant="ghost" size="icon-sm" className="mt-1 shrink-0">
          <Link href="/invoices" aria-label={t('back')}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className={cn('text-lg font-bold text-[var(--text-primary)] sm:text-xl', invoice.number && 'font-mono')}>{displayNumber(invoice, tc('draft'))}</h1>
            <InvoiceStatusBadge status={invoice.effectiveStatus} />
          </div>
          <p className="mt-0.5 text-sm text-[var(--text-muted)]">
            {client ? (
              <Link href={`/clients/${client.id}`} className="hover:text-primary-600 hover:underline">
                {invoice.clientName}
              </Link>
            ) : (
              invoice.clientName
            )}{' '}
            · {t('issuedOn', { date: fmt.date(invoice.issueDate) })}
          </p>
        </div>
        </div>
        <InvoiceActions invoice={invoice} companyName={org.name} clientEmail={client?.email} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="min-w-0 space-y-4 xl:col-span-2">
          {invoice.status !== 'draft' && invoice.status !== 'cancelled' && (
            <Card className="no-print">
              <CardContent className="py-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium text-[var(--text-secondary)]">{t('collected')}</span>
                  <span className="text-sm font-bold tabular-nums text-[var(--text-primary)]">
                    {money(invoice.amountPaid)} / {money(invoice.total)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-dark-muted">
                  <div className="h-full rounded-full bg-success-600 transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p
                  className={cn(
                    'mt-1.5 text-xs',
                    invoice.effectiveStatus === 'overdue' ? 'font-medium text-danger-600' : 'text-[var(--text-muted)]'
                  )}
                >
                  {invoice.status === 'paid'
                    ? t('paidOn', { date: fmt.date(invoice.paidAt!.slice(0, 10)) })
                    : invoice.effectiveStatus === 'overdue'
                      ? t('overdueBy', { amount: money(remaining), days: -daysToDue })
                      : daysToDue === 0
                        ? t('dueToday', { amount: money(remaining) })
                        : t('dueIn', { amount: money(remaining), days: daysToDue })}
                </p>
              </CardContent>
            </Card>
          )}

          {invoice.status === 'draft' && (
            <div className="no-print rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-muted)]">
              {t('draftNotice')}
            </div>
          )}

          <div className="print-area overflow-hidden rounded-xl border border-[var(--border)] shadow-xs">
            <InvoiceDocument data={doc} />
          </div>
        </div>

        <div className="no-print space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('info')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: t('client'), value: invoice.clientName },
                { label: t('currency'), value: invoice.currency },
                { label: t('issued'), value: fmt.date(invoice.issueDate) },
                { label: t('due'), value: fmt.date(invoice.dueDate) },
                { label: t('total'), value: money(invoice.total) },
                ...(invoice.sentAt ? [{ label: t('sentAt'), value: fmt.dateTime(invoice.sentAt) }] : []),
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between gap-2">
                  <span className="text-xs text-[var(--text-muted)]">{label}</span>
                  <span className="text-end text-xs font-medium text-[var(--text-primary)]">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {payments.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success-600" />
                  <CardTitle>{t('payments')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{tm(p.method)}</p>
                      <p className="truncate text-xs text-[var(--text-muted)]">
                        {fmt.date(p.paidOn)}
                        {p.reference ? ` · ${p.reference}` : ''}
                      </p>
                    </div>
                    <span className="whitespace-nowrap text-sm font-semibold tabular-nums text-success-600">+{money(p.amount)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-[var(--text-muted)]" />
                <CardTitle>{t('history')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ol className="relative space-y-4 border-s border-[var(--border)] ps-5">
                {events.map((e) => {
                  const meta = EVENT_META[e.type]
                  const amount = typeof e.payload?.amount === 'number' ? money(e.payload.amount) : null
                  return (
                    <li key={e.id} className="relative">
                      <span className={cn('absolute -start-[29px] top-0 rounded-full bg-[var(--bg-card)] p-0.5', meta.color)}>
                        <meta.icon className="h-4 w-4" />
                      </span>
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {t(`events.${e.type}`)}
                        {amount ? ` · ${amount}` : ''}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {fmt.dateTime(e.createdAt)}
                        {e.actorName ? ` · ${e.actorName}` : ''}
                      </p>
                    </li>
                  )
                })}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
