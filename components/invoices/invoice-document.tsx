import { useLocale, useTranslations } from 'next-intl'
import type { AppLocale } from '@/i18n/config'
import { createFormat } from '@/lib/format'
import type { InvoiceDocumentData } from '@/lib/invoice-document'
import type { PartySnapshot } from '@/lib/types'
import { cn } from '@/lib/utils'

// Rendu « papier » de la facture. Toujours clair (comme une feuille imprimée), y compris en mode sombre.
// Fonctionne côté serveur (détail, page publique) comme côté client (aperçu live).

function Party({ label, party, emptyLabel }: { label: string; party: PartySnapshot | null; emptyLabel: string }) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-[11px] text-gray-500">{label}</p>
      {party ? (
        <div className="space-y-0.5 text-[11px] leading-relaxed text-gray-500">
          {/* <bdi> : chaque ligne garde son propre sens d'écriture (numéros et adresses en arabe, hébreu…) */}
          <p className="text-[13px] font-semibold text-gray-900"><bdi>{party.name}</bdi></p>
          {party.email && <p className="truncate"><bdi>{party.email}</bdi></p>}
          {party.phone && <p><bdi dir="ltr">{party.phone}</bdi></p>}
          {(party.address || party.city || party.country) && (
            <p><bdi>{[party.address, party.city, party.country].filter(Boolean).join(', ')}</bdi></p>
          )}
          {party.taxId && <p><bdi>{party.taxId}</bdi></p>}
        </div>
      ) : (
        <p className="text-[12px] italic text-gray-400">{emptyLabel}</p>
      )}
    </div>
  )
}

const stampStyles: Partial<Record<NonNullable<InvoiceDocumentData['status']>, string>> = {
  paid: 'border-success-600 text-success-600',
  overdue: 'border-danger-600 text-danger-600',
  cancelled: 'border-gray-400 text-gray-400',
}

export function InvoiceDocument({ data, className }: { data: InvoiceDocumentData; className?: string }) {
  const t = useTranslations('document')
  const tStatus = useTranslations('status')
  const fmt = createFormat(useLocale() as AppLocale)
  const { currency } = data
  const money = (n: number) => fmt.money(n, currency)
  const stamp = data.status ? stampStyles[data.status] : undefined
  const balance = data.total - data.amountPaid

  return (
    <article
      className={cn(
        'invoice-paper relative bg-white p-4 text-gray-900 min-[400px]:p-6 sm:p-8',
        'font-sans [font-variant-numeric:tabular-nums]',
        className
      )}
    >
      {stamp && (
        <div
          className={cn(
            // Masqué sur mobile (le badge de statut suffit, et il chevaucherait le client)
            'pointer-events-none absolute end-8 top-28 hidden rotate-[-12deg] rounded-lg border-2 px-3 py-1 sm:block print:block',
            'text-sm font-bold uppercase tracking-widest opacity-80',
            stamp
          )}
        >
          {tStatus(data.status!)}
        </div>
      )}

      {/* En-tête */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-bold leading-none tracking-tight text-gray-900 min-[400px]:text-[26px]">{t('title')}</h2>
          <p className="mt-2 text-[12px] text-gray-500">
            {t('number')}{' '}
            {data.number ? (
              <span className="ms-1 font-mono font-medium text-gray-800">#{data.number}</span>
            ) : (
              <span className="ms-1 italic text-gray-400">{t('numberPending')}</span>
            )}
          </p>
        </div>
        {data.company.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.company.logoUrl} alt={data.company.name} className="h-12 w-12 shrink-0 rounded-full object-contain min-[400px]:h-14 min-[400px]:w-14" />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-600 text-lg font-bold text-white min-[400px]:h-14 min-[400px]:w-14">
            {data.company.name.slice(0, 2).toUpperCase()}
          </div>
        )}
      </header>

      {/* Parties & dates */}
      <section className="mt-7 grid grid-cols-2 gap-x-6 gap-y-5">
        <div className="col-span-2 grid grid-cols-1 gap-5 min-[440px]:grid-cols-2 min-[440px]:gap-6 print:grid-cols-2">
          <Party label={t('billedBy')} party={data.company} emptyLabel={t('selectClient')} />
          <Party label={t('billedTo')} party={data.client} emptyLabel={t('selectClient')} />
        </div>
        <div>
          <p className="text-[11px] text-gray-500">{t('issueDate')}</p>
          <p className="text-[12px] font-semibold text-gray-900">{fmt.dateLong(data.issueDate)}</p>
        </div>
        <div>
          <p className="text-[11px] text-gray-500">{t('dueDate')}</p>
          <p className="text-[12px] font-semibold text-gray-900">{fmt.dateLong(data.dueDate)}</p>
        </div>
      </section>

      {/* Lignes */}
      <section className="mt-7">
        <p className="mb-2 text-[11px] text-gray-500">{t('items')}</p>
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-start text-[11px] text-gray-500">
                <th className="py-2 ps-3 text-start font-medium">{t('designation')}</th>
                <th className="w-10 py-2 text-center font-medium">{t('qty')}</th>
                <th className="hidden w-24 py-2 text-end font-medium sm:table-cell">{t('unitPrice')}</th>
                <th className="w-12 py-2 text-center font-medium">{t('tax')}</th>
                <th className="py-2 pe-3 ps-2 text-end font-medium">{t('amount')}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center italic text-gray-400">
                    {t('noItems')}
                  </td>
                </tr>
              )}
              {data.items.map((item, i) => (
                <tr key={i} className="align-top">
                  <td className="py-2.5 pe-2 ps-3 text-gray-900">
                    {item.description ? <bdi>{item.description}</bdi> : <span className="italic text-gray-400">{t('untitled')}</span>}
                  </td>
                  <td className="py-2.5 text-center text-gray-700">{fmt.number(item.quantity)}</td>
                  <td className="hidden py-2.5 text-end text-gray-700 sm:table-cell">{fmt.amount(item.unitPrice, currency)}</td>
                  <td className="py-2.5 text-center text-gray-700">{fmt.number(item.taxRate)}%</td>
                  <td className="whitespace-nowrap py-2.5 pe-3 ps-2 text-end font-medium text-gray-900">{money(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totaux */}
          <dl className="space-y-0.5 border-t border-gray-200 px-3 py-2.5 text-[12px]">
            <div className="flex justify-between py-1">
              <dt className="font-medium text-gray-700">{t('subtotal')}</dt>
              <dd className="font-medium">{money(data.subtotal)}</dd>
            </div>
            {data.discountTotal > 0 && (
              <div className="flex justify-between py-1">
                <dt className="font-medium text-gray-700">
                  {t('discount')}
                  {data.discountType === 'percent' ? ` (${fmt.number(data.discountValue)} %)` : ''}
                </dt>
                <dd className="font-medium">−{money(data.discountTotal)}</dd>
              </div>
            )}
            {data.taxes.map((tax) => (
              <div key={tax.rate} className="flex justify-between py-1">
                <dt className="font-medium text-gray-700">{t('taxLine', { rate: fmt.number(tax.rate) })}</dt>
                <dd className="font-medium">{money(tax.amount)}</dd>
              </div>
            ))}
            <div className="!mt-1.5 flex justify-between border-t border-gray-200 pt-2.5">
              <dt className="text-[13px] font-bold">{t('total')}</dt>
              <dd className="text-[13px] font-bold">{money(data.total)}</dd>
            </div>
            {data.amountPaid > 0 && (
              <>
                <div className="flex justify-between py-1 text-success-700">
                  <dt>{t('alreadyPaid')}</dt>
                  <dd className="font-medium">−{money(data.amountPaid)}</dd>
                </div>
                <div className="flex justify-between rounded-md bg-gray-50 px-2 py-1.5">
                  <dt className="font-semibold">{t('balance')}</dt>
                  <dd className="font-bold">{money(balance)}</dd>
                </div>
              </>
            )}
          </dl>
        </div>
      </section>

      {data.notes && (
        <p className="mt-4 whitespace-pre-line rounded-lg border border-gray-200 px-3 py-2 text-[11px] text-gray-600">
          {t('note')} <bdi>{data.notes}</bdi>
        </p>
      )}

      {/* Pied */}
      <footer className="mt-8 flex flex-col gap-5 border-t border-gray-100 pt-5 min-[440px]:flex-row min-[440px]:items-end min-[440px]:justify-between min-[440px]:gap-6 print:flex-row print:items-end print:justify-between">
        <div className="min-w-0 text-[11px]">
          {data.paymentInstructions && (
            <>
              <p className="font-semibold text-gray-900">{t('paymentTerms')}</p>
              <p className="mt-1 whitespace-pre-line leading-relaxed text-gray-500">
                <bdi>{data.paymentInstructions}</bdi>
              </p>
            </>
          )}
        </div>
        <div className="shrink-0 self-end text-end">
          <p className="font-[cursive] text-xl italic text-gray-700">{data.company.name.split(' ')[0]}</p>
          <p className="mt-1 border-t border-gray-200 pt-1 text-[11px] font-medium text-gray-700">{data.company.name}</p>
        </div>
      </footer>
      {data.footerNote && (
        <p className="mt-6 text-center text-[10px] text-gray-400">
          <bdi>{data.footerNote}</bdi>
        </p>
      )}
    </article>
  )
}
