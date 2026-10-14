import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { InvoiceStatusBadge } from '@/components/ui/badge'
import type { AppLocale } from '@/i18n/config'
import { createFormat } from '@/lib/format'
import { displayNumber } from '@/lib/status'
import type { Invoice } from '@/lib/types'
import { cn } from '@/lib/utils'
import { InvoiceRowActions } from './invoice-row-actions'

/**
 * Version mobile des tableaux de factures : une carte par facture, sans défilement horizontal.
 * Affichée sous `md`, les tableaux prenant le relais au-dessus.
 */
export function InvoiceCardList({
  invoices,
  showClient = true,
  withActions = false,
  className,
}: {
  invoices: Invoice[]
  showClient?: boolean
  withActions?: boolean
  className?: string
}) {
  const t = useTranslations('table')
  const tc = useTranslations('common')
  const fmt = createFormat(useLocale() as AppLocale)
  return (
    <ul className={cn('divide-y divide-[var(--border-muted)] md:hidden', className)}>
      {invoices.map((inv) => {
        const remaining = inv.total - inv.amountPaid
        const partial = inv.status === 'sent' && inv.amountPaid > 0
        return (
          <li key={inv.id} className="flex items-start gap-2 px-4 py-3">
            <Link href={`/invoices/${inv.id}`} className="min-w-0 flex-1 active:opacity-70">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 truncate text-sm font-semibold text-[var(--text-primary)]">
                  {showClient ? inv.clientName : displayNumber(inv, tc('draft'))}
                </p>
                <p className="shrink-0 text-sm font-semibold tabular-nums text-[var(--text-primary)]">
                  {fmt.money(inv.total, inv.currency)}
                </p>
              </div>
              <div className="mt-1 flex items-center justify-between gap-3">
                <p className="min-w-0 truncate text-xs text-[var(--text-muted)]">
                  {showClient && (
                    <span className={cn(inv.number && 'font-mono')}>{displayNumber(inv, tc('draft'))} · </span>
                  )}
                  <span className={cn(inv.effectiveStatus === 'overdue' && 'font-medium text-danger-600')}>
                    {t('dueShort', { date: fmt.date(inv.dueDate, 'dayMonth') })}
                  </span>
                </p>
                <InvoiceStatusBadge status={inv.effectiveStatus} />
              </div>
              {partial && (
                <p className="mt-1 text-end text-[11px] text-[var(--text-muted)]">
                  {t('remaining', { amount: fmt.money(remaining, inv.currency) })}
                </p>
              )}
            </Link>
            {withActions && (
              <div className="-me-2 -mt-1">
                <InvoiceRowActions invoice={inv} />
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
