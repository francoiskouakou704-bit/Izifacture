import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { buttonVariants } from './button'

/** Pagination par liens (?page=N), compatible Server Components. */
export function Pagination({
  page,
  pageSize,
  total,
  hrefFor,
  itemLabel,
}: {
  page: number
  pageSize: number
  total: number
  hrefFor: (page: number) => string
  itemLabel: string
}) {
  const t = useTranslations('pagination')
  if (total === 0) return null
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  // 1 … p-1 p p+1 … N
  const shown = Array.from(new Set([1, page - 1, page, page + 1, pages]))
    .filter((p) => p >= 1 && p <= pages)
    .sort((a, b) => a - b)

  const navCls = (disabled: boolean) =>
    cn(buttonVariants({ variant: 'outline', size: 'xs' }), disabled && 'pointer-events-none opacity-50')

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] px-4 py-3">
      <p className="text-sm text-[var(--text-muted)]">
        {t('range', { from, to, total, label: itemLabel })}
      </p>
      {pages > 1 && (
        <nav aria-label={t('label')} className="flex items-center gap-1">
          <Link href={hrefFor(page - 1)} className={navCls(page <= 1)} aria-disabled={page <= 1}>
            {t('previous')}
          </Link>
          {shown.map((p, i) => (
            <span key={p} className="flex items-center gap-1">
              {i > 0 && p - shown[i - 1] > 1 && <span className="px-1 text-[var(--text-muted)]">…</span>}
              <Link
                href={hrefFor(p)}
                className={cn(buttonVariants({ variant: p === page ? 'primary' : 'ghost', size: 'xs' }), 'min-w-7')}
                aria-current={p === page ? 'page' : undefined}
              >
                {p}
              </Link>
            </span>
          ))}
          <Link href={hrefFor(page + 1)} className={navCls(page >= pages)} aria-disabled={page >= pages}>
            {t('next')}
          </Link>
        </nav>
      )}
    </div>
  )
}
