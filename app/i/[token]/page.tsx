import { Zap } from 'lucide-react'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { InvoiceDocument } from '@/components/invoices/invoice-document'
import { DownloadPdfButton } from '@/components/invoices/download-pdf-button'
import { PrintButton } from '@/components/invoices/print-button'
import { LocaleSwitcher } from '@/components/layout/locale-switcher'
import { InvoiceStatusBadge } from '@/components/ui/badge'
import { getDataSource } from '@/lib/data'
import { getFormat } from '@/lib/i18n/server'
import { invoiceToDocument } from '@/lib/invoice-document'

// Page publique : accessible sans compte via un jeton non devinable. Jamais indexée.
// Affichée dans la langue du client final (navigateur ou choix via le sélecteur).
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta')
  return { title: t('invoice', { number: '' }).trim(), robots: { index: false, follow: false } }
}
export const dynamic = 'force-dynamic'

export default async function PublicInvoicePage(props: { params: Promise<{ token: string }> }) {
  const params = await props.params
  const ds = getDataSource()
  const found = await ds.getInvoiceByToken(params.token)
  if (!found) notFound()
  const { invoice, organization } = found
  const [t, fmt] = await Promise.all([getTranslations('publicInvoice'), getFormat()])

  // Trace la consultation (utile pour savoir si le client a vu la facture)
  await ds.recordPublicView(params.token)

  const remaining = invoice.total - invoice.amountPaid
  const payable = invoice.status === 'sent' && remaining > 0

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8 dark:bg-dark-bg">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="no-print card flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {t('header', { number: invoice.number ?? '', company: organization.name })}
              </p>
              <InvoiceStatusBadge status={invoice.effectiveStatus} />
            </div>
            <p className="mt-0.5 text-sm text-[var(--text-muted)]">
              {payable
                ? t('toPay', { amount: fmt.money(remaining, invoice.currency), date: fmt.dateLong(invoice.dueDate) })
                : invoice.status === 'paid'
                  ? t('paid')
                  : t('cancelled')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <PrintButton />
            <DownloadPdfButton fileBase={invoice.number ?? ''} variant="primary" />
          </div>
        </div>

        <div className="print-area overflow-hidden rounded-xl shadow-md">
          <InvoiceDocument data={invoiceToDocument(invoice, organization)} />
        </div>

        <p className="no-print flex items-center justify-center gap-1.5 text-xs text-[var(--text-muted)]">
          {t('poweredBy')}
          <Link href="/" className="inline-flex items-center gap-1 font-semibold text-primary-600">
            <Zap className="h-3 w-3" /> izifacture
          </Link>
        </p>
      </div>
    </div>
  )
}
