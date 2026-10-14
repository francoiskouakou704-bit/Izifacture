'use client'

import { ExternalLink, FileText, Paperclip } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useFormat } from '@/lib/i18n/client'
import type { InvoiceDocumentData } from '@/lib/invoice-document'
import { cn } from '@/lib/utils'

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://izi-facture.app').replace(/^https?:\/\//, '')

/** Aperçu de l'e-mail que reçoit le client lors de l'envoi de la facture. Toujours clair, comme un client mail. */
export function InvoiceEmailPreview({
  data,
  number,
  className,
}: {
  data: InvoiceDocumentData
  /** Numéro définitif ou prévisionnel (brouillon). */
  number: string
  className?: string
}) {
  const t = useTranslations('invoiceForm')
  const tActions = useTranslations('invoiceActions')
  const tPublic = useTranslations('publicInvoice')
  const tDoc = useTranslations('document')
  const fmt = useFormat()
  const amount = fmt.money(data.total, data.currency)
  const date = fmt.dateLong(data.dueDate)
  const company = data.company.name

  const headers = [
    { label: t('emailFrom'), value: `${company}${data.company.email ? ` <${data.company.email}>` : ''}` },
    {
      label: t('emailTo'),
      value: data.client
        ? `${data.client.name}${data.client.email ? ` <${data.client.email}>` : ''}`
        : null,
    },
    { label: t('emailSubjectLabel'), value: tActions('emailSubject', { number, company }) },
  ]

  return (
    <article className={cn('relative overflow-hidden bg-white text-gray-900', className)}>
      {/* En-têtes du message */}
      <dl className="space-y-1.5 border-b border-gray-100 px-4 py-4 text-[12px] sm:px-8">
        {headers.map((h) => (
          <div key={h.label} className="flex gap-2">
            <dt className="w-14 shrink-0 text-gray-400">{h.label}</dt>
            <dd className={cn('min-w-0 truncate', h.value ? 'text-gray-800' : 'italic text-gray-400')}>
              {h.value ?? tDoc('selectClient')}
            </dd>
          </div>
        ))}
      </dl>

      {/* Corps */}
      <div className="px-4 py-6 sm:px-8 sm:py-8">
        <div className="flex items-center gap-3">
          {data.company.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.company.logoUrl} alt="" className="h-10 w-10 rounded-full object-contain" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
              {company.slice(0, 2).toUpperCase()}
            </div>
          )}
          <p className="text-sm font-semibold">{company}</p>
        </div>

        <p className="mt-6 whitespace-pre-line text-[13px] leading-relaxed text-gray-700">
          {tActions('shareText', { number, company, amount, date, url: `${SITE}/i/…` })}
        </p>

        <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-5 text-center">
          <p className="text-[11px] uppercase tracking-wider text-gray-500">{tDoc('total')}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight [font-variant-numeric:tabular-nums]">{amount}</p>
          <p className="mt-1 text-[12px] text-gray-500">
            {tDoc('dueDate')} <span className="font-medium text-gray-700">{date}</span>
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-[13px] font-medium text-white">
            {t('emailCta')} <ExternalLink className="h-3.5 w-3.5" />
          </span>
        </div>

        {data.notes && (
          <p className="mt-5 whitespace-pre-line text-[12px] italic leading-relaxed text-gray-500">{data.notes}</p>
        )}

        {/* Pièce jointe */}
        <div className="mt-6">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] text-gray-500">
            <Paperclip className="h-3.5 w-3.5" /> {t('emailAttachment')}
          </p>
          <div className="inline-flex max-w-full items-center gap-2.5 rounded-lg border border-gray-200 px-3 py-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-danger-50 text-danger-600">
              <FileText className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[12px] font-medium">{number}.pdf</span>
              <span className="block text-[11px] text-gray-400">PDF</span>
            </span>
          </div>
        </div>
      </div>

      <p className="border-t border-gray-100 px-4 py-3 text-center text-[10px] text-gray-400 sm:px-8">
        {tPublic('poweredBy')} izi-facture
      </p>
    </article>
  )
}
