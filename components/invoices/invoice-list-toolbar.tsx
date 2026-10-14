'use client'

import { Search, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { InvoiceSort, InvoiceStatusFilter } from '@/lib/data/types'
import { cn } from '@/lib/utils'

const TABS: InvoiceStatusFilter[] = ['all', 'draft', 'sent', 'overdue', 'paid', 'cancelled']

const SORTS: InvoiceSort[] = ['newest', 'oldest', 'due_soon', 'amount_desc', 'amount_asc']

export function InvoiceListToolbar({
  status,
  sort,
  q,
  counts,
}: {
  status: InvoiceStatusFilter
  sort: InvoiceSort
  q: string
  counts: Record<InvoiceStatusFilter, number>
}) {
  const t = useTranslations('invoiceList')
  const tc = useTranslations('common')
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [search, setSearch] = useState(q)

  function hrefWith(patch: Record<string, string | undefined>) {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v)
      else next.delete(k)
    }
    next.delete('page') // tout changement de filtre revient à la page 1
    const qs = next.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  // Recherche avec anti-rebond
  useEffect(() => {
    if (search === q) return
    const t = setTimeout(
      () => router.replace(hrefWith({ q: search.trim() || undefined }), { scroll: false }),
      300
    )
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  return (
    <>
      <div className="no-scrollbar overflow-x-auto border-b border-[var(--border)] px-2">
        <div className="flex min-w-max">
          {TABS.map((tab) => {
            const active = tab === status
            return (
              <Link
                key={tab}
                href={hrefWith({ status: tab === 'all' ? undefined : tab })}
                scroll={false}
                className={cn(
                  '-mb-px flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors',
                  active
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                )}
              >
                {t(`tabs.${tab}`)}
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-xs font-semibold',
                    active
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-dark-muted dark:text-gray-400'
                  )}
                >
                  {counts[tab]}
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] px-4 py-3">
        <div className="min-w-[200px] flex-1 sm:max-w-sm">
          <Input
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchLabel')}
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X className="h-3.5 w-3.5" /> {tc('clear')}
          </button>
        )}
        <div className="w-full sm:ms-auto sm:w-48">
          <Select
            value={sort}
            onValueChange={(v) =>
              router.replace(hrefWith({ sort: v === 'newest' ? undefined : v }), { scroll: false })
            }
          >
            <SelectTrigger aria-label={t('sortLabel')} className="h-8 py-1">
              <SelectValue>{t(`sort.${sort}`)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((s) => (
                <SelectItem key={s} value={s}>
                  {t(`sort.${s}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </>
  )
}
