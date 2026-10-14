'use client'

import { Archive, ArchiveRestore, Eye, FilePlus2, Mail, MoreHorizontal, Pencil, Phone, Plus, Search, Users } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { setClientArchivedAction } from '@/actions/clients'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import type { ClientWithStats } from '@/lib/data/types'
import { useAction } from '@/lib/hooks/use-action'
import { useFormat } from '@/lib/i18n/client'
import { cn } from '@/lib/utils'
import { ClientDialog } from './client-dialog'

export function ClientsView({ clients, q, showArchived }: { clients: ClientWithStats[]; q: string; showArchived: boolean }) {
  const t = useTranslations('clients')
  const fmt = useFormat()
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const { run } = useAction()
  const [search, setSearch] = useState(q)
  const [dialog, setDialog] = useState<{ open: boolean; client: ClientWithStats | null }>({ open: false, client: null })

  function setParam(key: string, value?: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    const qs = next.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  useEffect(() => {
    if (search === q) return
    const timer = setTimeout(() => setParam('q', search.trim() || undefined), 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const openNew = () => setDialog({ open: true, client: null })

  return (
    <div className="animate-fade-in space-y-5">
      <div className="page-header flex-wrap gap-3">
        <div>
          <h1 className="page-title">{t('title')}</h1>
          <p className="page-subtitle">
            {t('count', { count: clients.length, archived: String(showArchived) })}
          </p>
        </div>
        <Button size="sm" onClick={openNew}>
          <Plus className="h-3.5 w-3.5" /> {t('new')}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[200px] flex-1 sm:max-w-sm">
          <Input
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchPlaceholder')}
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text-secondary)]">
          <input
            type="checkbox"
            className="h-4 w-4 accent-primary-600"
            checked={showArchived}
            onChange={(e) => setParam('archived', e.target.checked ? '1' : undefined)}
          />
          {t('showArchived')}
        </label>
      </div>

      {clients.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title={q ? t('notFoundTitle') : t('emptyTitle')}
            description={q ? t('notFoundDescription') : t('emptyDescription')}
            action={
              !q && (
                <Button onClick={openNew}>
                  <Plus className="h-4 w-4" /> {t('add')}
                </Button>
              )
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {clients.map((client) => {
            const main = client.totals[0]
            return (
              <div key={client.id} className={cn('card group flex flex-col p-4 transition-shadow hover:shadow-md', client.archivedAt && 'opacity-60')}>
                <div className="mb-3 flex items-start justify-between gap-2">
                  <Link href={`/clients/${client.id}`} className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 text-sm font-bold text-white">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--text-primary)] group-hover:text-primary-600">{client.name}</p>
                      <p className="truncate text-xs text-[var(--text-muted)]">
                        {[client.city, client.country].filter(Boolean).join(', ') || '—'}
                      </p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-1">
                    {client.archivedAt && <Badge variant="muted">{t('archivedBadge')}</Badge>}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label={t('actionsFor', { name: client.name })}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/clients/${client.id}`}>
                            <Eye className="h-4 w-4" /> {t('viewProfile')}
                          </Link>
                        </DropdownMenuItem>
                        {!client.archivedAt && (
                          <DropdownMenuItem asChild>
                            <Link href={`/invoices/new?client=${client.id}`}>
                              <FilePlus2 className="h-4 w-4" /> {t('newInvoice')}
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onSelect={() => setDialog({ open: true, client })}>
                          <Pencil className="h-4 w-4" /> {t('edit')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={() =>
                            run(() => setClientArchivedAction(client.id, !client.archivedAt), {
                              success: client.archivedAt ? t('restored') : t('archived'),
                            })
                          }
                        >
                          {client.archivedAt ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                          {client.archivedAt ? t('restore') : t('archive')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="mb-3 flex-1 space-y-1.5">
                  {client.email && (
                    <p className="flex items-center gap-1.5 truncate text-xs text-[var(--text-muted)]">
                      <Mail className="h-3 w-3 shrink-0" /> {client.email}
                    </p>
                  )}
                  {client.phone && (
                    <p className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                      <Phone className="h-3 w-3 shrink-0" /> {client.phone}
                    </p>
                  )}
                </div>

                <div className="flex items-end justify-between border-t border-[var(--border)] pt-3">
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">
                      {t('invoiceCount', { count: client.invoiceCount })}
                    </p>
                    <p className="text-sm font-semibold tabular-nums text-[var(--text-primary)]">
                      {main ? fmt.money(main.invoiced, main.currency) : '—'}
                      {client.totals.length > 1 && <span className="ms-1 text-xs font-normal text-[var(--text-muted)]">{t('moreCurrencies', { count: client.totals.length - 1 })}</span>}
                    </p>
                  </div>
                  {main && main.outstanding > 0 && (
                    <p className="text-end text-xs font-medium text-warning-700">
                      {fmt.money(main.outstanding, main.currency)}
                      <span className="block font-normal text-[var(--text-muted)]">{t('toCollect')}</span>
                    </p>
                  )}
                </div>
              </div>
            )
          })}

          {!q && (
            <button
              type="button"
              onClick={openNew}
              className="group flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--border)] p-4 transition-all hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/20"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 transition-colors group-hover:bg-primary-100 dark:bg-dark-elevated">
                <Plus className="h-5 w-5 text-[var(--text-muted)] group-hover:text-primary-600" />
              </div>
              <p className="text-sm font-medium text-[var(--text-muted)] group-hover:text-primary-600">{t('new')}</p>
            </button>
          )}
        </div>
      )}

      <ClientDialog open={dialog.open} client={dialog.client} onOpenChange={(open) => setDialog((d) => ({ ...d, open }))} />
    </div>
  )
}
