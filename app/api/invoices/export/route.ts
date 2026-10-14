import { getLocale, getTranslations } from 'next-intl/server'
import { getDataSource, type InvoiceStatusFilter } from '@/lib/data'
import { fromMinor } from '@/lib/money'
import { todayISO } from '@/lib/status'

const STATUSES: InvoiceStatusFilter[] = ['all', 'draft', 'sent', 'paid', 'overdue', 'cancelled']

/** Échappe une cellule CSV et neutralise les formules (=, +, -, @) interprétées par Excel. */
function cell(value: string | number | undefined | null): string {
  let s = value === undefined || value === null ? '' : String(value)
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export async function GET(request: Request) {
  // Phase 4 : protégé par le middleware d'authentification
  const url = new URL(request.url)
  const status = STATUSES.includes(url.searchParams.get('status') as InvoiceStatusFilter)
    ? (url.searchParams.get('status') as InvoiceStatusFilter)
    : 'all'
  const q = url.searchParams.get('q')?.slice(0, 100) ?? ''

  const [{ rows }, t, tStatus, tc, locale] = await Promise.all([
    getDataSource().listInvoices({ status, q, sort: 'oldest', pageSize: 10_000 }),
    getTranslations('csv'),
    getTranslations('status'),
    getTranslations('common'),
    getLocale(),
  ])

  // Séparateur « ; » et virgule décimale en français (Excel FR) ; « , » et point en anglais.
  const isFr = locale === 'fr'
  const sep = isFr ? ';' : ','
  const amount = (minor: number, currency: Parameters<typeof fromMinor>[1]) => {
    const n = fromMinor(minor, currency).toString()
    return isFr ? n.replace('.', ',') : n
  }
  const esc = (v: string | number | undefined | null) => {
    const c = cell(v)
    return !isFr && c.includes(',') && !c.startsWith('"') ? `"${c}"` : c
  }

  const header = ['number', 'client', 'issued', 'due', 'currency', 'subtotal', 'discount', 'tax', 'total', 'paid', 'remaining', 'status'].map((k) =>
    t(k as 'number')
  )
  const lines = rows.map((i) =>
    [
      esc(i.number ?? tc('draft')),
      esc(i.clientName),
      esc(i.issueDate),
      esc(i.dueDate),
      esc(i.currency),
      esc(amount(i.subtotal, i.currency)),
      esc(amount(i.discountTotal, i.currency)),
      esc(amount(i.taxTotal, i.currency)),
      esc(amount(i.total, i.currency)),
      esc(amount(i.amountPaid, i.currency)),
      esc(amount(i.status === 'sent' ? i.total - i.amountPaid : 0, i.currency)),
      esc(tStatus(i.effectiveStatus)),
    ].join(sep)
  )

  // BOM UTF-8 pour qu'Excel affiche correctement les accents
  const body = '﻿' + [header.join(sep), ...lines].join('\r\n')
  return new Response(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${t('filename')}-${todayISO()}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
