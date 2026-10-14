'use client'

import {
  Ban,
  Copy,
  CreditCard,
  Link2,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Printer,
  Send,
  Share2,
  Trash2,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { cancelInvoiceAction, deleteInvoiceAction, duplicateInvoiceAction, sendInvoiceAction } from '@/actions/invoices'
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
import { canRecordPayment } from '@/lib/status'
import type { Invoice } from '@/lib/types'
import { DownloadPdfButton } from './download-pdf-button'
import { PaymentDialog } from './payment-dialog'

type Confirm = 'send' | 'delete' | 'cancel' | null

export function InvoiceActions({ invoice, companyName, clientEmail }: { invoice: Invoice; companyName: string; clientEmail?: string }) {
  const t = useTranslations('invoiceActions')
  const fmt = useFormat()
  const router = useRouter()
  const { pending, run } = useAction()
  const [confirm, setConfirm] = useState<Confirm>(null)
  const [paymentOpen, setPaymentOpen] = useState(false)

  const isDraft = invoice.status === 'draft'
  const publicUrl = () => `${window.location.origin}/i/${invoice.publicToken}`
  const shareText = () =>
    t('shareText', {
      number: invoice.number ?? '',
      company: companyName,
      amount: fmt.money(invoice.total, invoice.currency),
      date: fmt.dateLong(invoice.dueDate),
      url: publicUrl(),
    })

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl())
      toast.success(t('linkCopied'))
    } catch {
      toast.error(t('copyFailed'))
    }
  }

  const duplicate = () =>
    run(() => duplicateInvoiceAction(invoice.id), {
      success: t('copyCreated'),
      onSuccess: (r) => router.push(`/invoices/${r.id}/edit`),
    })

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isDraft ? (
        <>
          <Button asChild variant="outline" size="sm">
            <Link href={`/invoices/${invoice.id}/edit`}>
              <Pencil className="h-3.5 w-3.5" /> {t('edit')}
            </Link>
          </Button>
          <Button size="sm" onClick={() => setConfirm('send')} disabled={pending}>
            <Send className="h-3.5 w-3.5" /> {t('issue')}
          </Button>
        </>
      ) : (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Share2 className="h-3.5 w-3.5" /> {t('share')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={copyLink}>
                <Link2 className="h-4 w-4" /> {t('copyLink')}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareText())}`, '_blank', 'noopener')}>
                <MessageCircle className="h-4 w-4" /> {t('whatsapp')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  const subject = encodeURIComponent(t('emailSubject', { number: invoice.number ?? '', company: companyName }))
                  window.location.href = `mailto:${clientEmail ?? ''}?subject=${subject}&body=${encodeURIComponent(shareText())}`
                }}
              >
                <Mail className="h-4 w-4" /> {t('email')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {canRecordPayment(invoice) && (
            <Button variant="success" size="sm" onClick={() => setPaymentOpen(true)}>
              <CreditCard className="h-3.5 w-3.5" /> {t('recordPayment')}
            </Button>
          )}
        </>
      )}

      <DownloadPdfButton fileBase={invoice.number ?? t('draftFileName')} />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon-sm" className="h-8 w-8" aria-label={t('more')} disabled={pending}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => window.print()}>
            <Printer className="h-4 w-4" /> {t('printOnly')}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={duplicate}>
            <Copy className="h-4 w-4" /> {t('duplicate')}
          </DropdownMenuItem>
          {invoice.status === 'sent' && invoice.amountPaid === 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive onSelect={() => setConfirm('cancel')}>
                <Ban className="h-4 w-4" /> {t('cancel')}
              </DropdownMenuItem>
            </>
          )}
          {isDraft && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive onSelect={() => setConfirm('delete')}>
                <Trash2 className="h-4 w-4" /> {t('deleteDraft')}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <PaymentDialog invoice={invoice} open={paymentOpen} onOpenChange={setPaymentOpen} />

      <ConfirmDialog
        open={confirm === 'send'}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={t('issueTitle')}
        description={t('issueDescription', { amount: fmt.money(invoice.total, invoice.currency) })}
        confirmLabel={t('issueButton')}
        loading={pending}
        onConfirm={() =>
          run(() => sendInvoiceAction(invoice.id), { success: (r) => t('issued', { number: r.number ?? '' }), onSuccess: () => setConfirm(null) })
        }
      />
      <ConfirmDialog
        open={confirm === 'cancel'}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={t('cancelTitle')}
        description={t('cancelDescription')}
        confirmLabel={t('cancel')}
        
        variant="destructive"
        loading={pending}
        onConfirm={() => run(() => cancelInvoiceAction(invoice.id), { success: t('cancelled'), onSuccess: () => setConfirm(null) })}
      />
      <ConfirmDialog
        open={confirm === 'delete'}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={t('deleteTitle')}
        description={t('deleteDescription')}
        confirmLabel={t('deleteDraft')}
        variant="destructive"
        loading={pending}
        onConfirm={() =>
          run(() => deleteInvoiceAction(invoice.id), {
            refresh: false,
            success: t('deleted'),
            onSuccess: () => router.push('/invoices'),
          })
        }
      />
    </div>
  )
}
