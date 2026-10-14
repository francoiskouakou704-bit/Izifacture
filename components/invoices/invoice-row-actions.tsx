'use client'

import { Check, Copy, Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { deleteInvoiceAction, duplicateInvoiceAction, markInvoicePaidAction } from '@/actions/invoices'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAction } from '@/lib/hooks/use-action'
import { useFormat } from '@/lib/i18n/client'
import { canRecordPayment, displayNumber, isDeletable, isEditable } from '@/lib/status'
import type { Invoice } from '@/lib/types'

export function InvoiceRowActions({ invoice }: { invoice: Invoice }) {
  const t = useTranslations('rowActions')
  const tc = useTranslations('common')
  const fmt = useFormat()
  const router = useRouter()
  const { pending, run } = useAction()
  const [confirm, setConfirm] = useState<'delete' | 'paid' | null>(null)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={t('label', { number: displayNumber(invoice, tc('draft')) })} disabled={pending}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/invoices/${invoice.id}`}>
              <Eye className="h-4 w-4" /> {t('view')}
            </Link>
          </DropdownMenuItem>
          {isEditable(invoice.status) && (
            <DropdownMenuItem asChild>
              <Link href={`/invoices/${invoice.id}/edit`}>
                <Pencil className="h-4 w-4" /> {t('edit')}
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onSelect={() =>
              run(() => duplicateInvoiceAction(invoice.id), {
                success: t('duplicated'),
                onSuccess: (r) => router.push(`/invoices/${r.id}/edit`),
              })
            }
          >
            <Copy className="h-4 w-4" /> {t('duplicate')}
          </DropdownMenuItem>
          {canRecordPayment(invoice) && (
            <DropdownMenuItem onSelect={() => setConfirm('paid')}>
              <Check className="h-4 w-4" /> {t('markPaid')}
            </DropdownMenuItem>
          )}
          {isDeletable(invoice.status) && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive onSelect={() => setConfirm('delete')}>
                <Trash2 className="h-4 w-4" /> {t('delete')}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirm === 'delete'}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={t('deleteTitle')}
        description={t('deleteDescription')}
        confirmLabel={t('delete')}
        variant="destructive"
        loading={pending}
        onConfirm={() =>
          run(() => deleteInvoiceAction(invoice.id), { success: t('deleted'), onSuccess: () => setConfirm(null) })
        }
      />
      <ConfirmDialog
        open={confirm === 'paid'}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={t('markPaidTitle')}
        description={t('markPaidDescription', { amount: fmt.money(invoice.total - invoice.amountPaid, invoice.currency) })}
        confirmLabel={t('markPaid')}
        variant="success"
        loading={pending}
        onConfirm={() =>
          run(() => markInvoicePaidAction(invoice.id), { success: t('markedPaid'), onSuccess: () => setConfirm(null) })
        }
      />
    </>
  )
}
