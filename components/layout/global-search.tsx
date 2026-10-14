'use client'

import { ArrowRight, CornerDownLeft, FileText, Loader2, Search, User, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { globalSearchAction, type SearchResults } from '@/actions/search'
import { InvoiceStatusBadge } from '@/components/ui/badge'
import { useFormat } from '@/lib/i18n/client'
import { cn } from '@/lib/utils'

type Item =
  | { kind: 'invoice'; href: string; data: SearchResults['invoices'][number] }
  | { kind: 'client'; href: string; data: SearchResults['clients'][number] }
  | { kind: 'all'; href: string }

/** Met en évidence la partie du texte qui correspond à la recherche. */
function Highlight({ text, query }: { text: string; query: string }) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (!query || idx < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-primary-100 px-0.5 text-inherit dark:bg-primary-500/30 dark:text-primary-100">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

/**
 * Recherche globale de la barre du haut : clients et factures.
 * Raccourcis : Ctrl/⌘ + K ou « / » pour ouvrir, ↑ ↓ pour naviguer, Entrée pour ouvrir, Échap pour fermer.
 */
export function GlobalSearch() {
  const t = useTranslations('search')
  const tc = useTranslations('common')
  const fmt = useFormat()
  const router = useRouter()
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const requestId = useRef(0)

  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchResults | null>(null)
  const [active, setActive] = useState(0)
  const [hintIndex, setHintIndex] = useState(0)
  const [isMac, setIsMac] = useState(false)

  const hints = t.raw('hints') as string[]
  const q = query.trim()

  // Placeholder animé : alterne entre « client », « facture » et des exemples
  useEffect(() => {
    if (focused || query) return
    const id = setInterval(() => setHintIndex((i) => (i + 1) % hints.length), 2800)
    return () => clearInterval(id)
  }, [focused, query, hints.length])

  useEffect(() => setIsMac(/Mac|iPhone|iPad/.test(navigator.platform)), [])

  // Raccourcis clavier globaux
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      const typing = target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Fermeture au clic extérieur
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  // Recherche avec anti-rebond ; les réponses obsolètes sont ignorées
  useEffect(() => {
    if (q.length < 2) {
      setResults(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const id = ++requestId.current
    const timer = setTimeout(async () => {
      try {
        const res = await globalSearchAction(q)
        if (id === requestId.current) {
          setResults(res)
          setActive(0)
        }
      } finally {
        if (id === requestId.current) setLoading(false)
      }
    }, 220)
    return () => clearTimeout(timer)
  }, [q])

  const items = useMemo<Item[]>(() => {
    if (!results) return []
    return [
      ...results.invoices.map((data) => ({ kind: 'invoice' as const, href: `/invoices/${data.id}`, data })),
      ...results.clients.map((data) => ({ kind: 'client' as const, href: `/clients/${data.id}`, data })),
      ...(results.invoiceTotal > 0 ? [{ kind: 'all' as const, href: `/invoices?q=${encodeURIComponent(q)}` }] : []),
    ]
  }, [results, q])

  function go(item: Item | undefined) {
    if (!item) return
    router.push(item.href)
    setOpen(false)
    setQuery('')
    inputRef.current?.blur()
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((i) => (items.length ? (i + 1) % items.length : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (items.length ? (i - 1 + items.length) % items.length : 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      go(items[active])
    } else if (e.key === 'Escape') {
      if (query) setQuery('')
      else inputRef.current?.blur()
      setOpen(false)
    }
  }

  const showPanel = open && q.length >= 2
  const optionId = (i: number) => `${listId}-opt-${i}`
  let index = -1

  const row = (item: Item, content: React.ReactNode) => {
    index++
    const i = index
    return (
      <li
        key={item.href}
        id={optionId(i)}
        role="option"
        aria-selected={i === active}
        onMouseEnter={() => setActive(i)}
        onMouseDown={(e) => e.preventDefault()} // garde le focus dans le champ
        onClick={() => go(item)}
        style={{ animationDelay: `${i * 30}ms` }}
        className={cn(
          'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 motion-safe:animate-item-in',
          i === active ? 'bg-primary-50 dark:bg-primary-950/50' : 'hover:bg-gray-50 dark:hover:bg-dark-elevated'
        )}
      >
        {content}
        <CornerDownLeft className={cn('h-3.5 w-3.5 shrink-0 text-primary-600 transition-opacity', i === active ? 'opacity-100' : 'opacity-0')} />
      </li>
    )
  }

  return (
    <div
      ref={rootRef}
      className={cn(
        'relative w-full transition-[max-width] duration-300 ease-out motion-reduce:transition-none',
        focused ? 'max-w-xl' : 'max-w-md'
      )}
    >
      <div
        className={cn(
          'group relative flex h-10 items-center gap-2 rounded-xl border bg-gray-50 px-3 transition-all duration-200 dark:bg-dark-elevated',
          focused
            ? 'border-primary-400 bg-[var(--bg-card)] shadow-[0_0_0_4px_rgb(59_91_219/0.12)] dark:border-primary-500 dark:bg-dark-surface'
            : 'border-[var(--border)] hover:border-gray-400 dark:hover:border-dark-muted'
        )}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary-600" />
        ) : (
          <Search
            className={cn(
              'h-4 w-4 shrink-0 transition-all duration-200',
              focused ? 'scale-110 text-primary-600' : 'text-[var(--text-muted)]'
            )}
          />
        )}

        <div className="relative min-w-0 flex-1">
          <input
            ref={inputRef}
            type="search"
            role="combobox"
            aria-label={t('label')}
            aria-expanded={showPanel}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={showPanel && items.length ? optionId(active) : undefined}
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onFocus={() => {
              setFocused(true)
              setOpen(true)
            }}
            onBlur={() => setFocused(false)}
            onKeyDown={onKeyDown}
            className="h-9 w-full bg-transparent text-sm text-[var(--text-primary)] outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {/* Placeholder animé (masqué dès que l'on tape) */}
          {!query && (
            <span aria-hidden className="pointer-events-none absolute inset-0 flex items-center overflow-hidden">
              <span
                key={focused ? 'focused' : hintIndex}
                className="truncate text-sm text-[var(--text-muted)] motion-safe:animate-hint-in"
              >
                {focused ? t('label') + '…' : hints[hintIndex]}
              </span>
            </span>
          )}
        </div>

        {query ? (
          <button
            type="button"
            aria-label={tc('clear')}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setQuery('')
              inputRef.current?.focus()
            }}
            className="rounded-md p-0.5 text-[var(--text-muted)] hover:bg-gray-200 hover:text-[var(--text-primary)] dark:hover:bg-dark-muted"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <kbd
            className={cn(
              'hidden shrink-0 select-none items-center gap-0.5 rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-1.5 py-0.5 font-sans text-[10px] font-medium text-[var(--text-muted)] transition-opacity sm:flex',
              focused && 'opacity-0'
            )}
          >
            {isMac ? '⌘' : 'Ctrl'} K
          </kbd>
        )}
      </div>

      {showPanel && (
        <div className="absolute start-0 end-0 top-full z-50 mt-2 origin-top overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-lg motion-safe:animate-dropdown-in">
          <ul id={listId} role="listbox" aria-label={t('label')} className="max-h-[min(70vh,420px)] overflow-y-auto p-1.5">
            {!results && (
              <li className="flex items-center gap-2 px-3 py-6 text-sm text-[var(--text-muted)]">
                <Loader2 className="h-4 w-4 animate-spin" /> {t('searching')}
              </li>
            )}

            {results && items.length === 0 && (
              <li className="px-3 py-6 text-center">
                <p className="text-sm font-medium text-[var(--text-primary)]">{t('noResults', { q })}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{t('noResultsHint')}</p>
              </li>
            )}

            {results && results.invoices.length > 0 && (
              <>
                <li role="presentation" className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  {t('invoices')}
                </li>
                {items
                  .filter((it) => it.kind === 'invoice')
                  .map((item) => {
                    const inv = (item as Extract<Item, { kind: 'invoice' }>).data
                    return row(
                      item,
                      <>
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950/50">
                          <FileText className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-[var(--text-primary)]">
                            <Highlight text={inv.clientName} query={q} />
                          </span>
                          <span className={cn('block truncate text-xs text-[var(--text-muted)]', inv.number && 'font-mono')}>
                            <Highlight text={inv.number ?? tc('draft')} query={q} /> · {fmt.money(inv.total, inv.currency)}
                          </span>
                        </span>
                        <InvoiceStatusBadge status={inv.status} />
                      </>
                    )
                  })}
              </>
            )}

            {results && results.clients.length > 0 && (
              <>
                <li role="presentation" className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  {t('clients')}
                </li>
                {items
                  .filter((it) => it.kind === 'client')
                  .map((item) => {
                    const c = (item as Extract<Item, { kind: 'client' }>).data
                    return row(
                      item,
                      <>
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 text-xs font-bold text-white">
                          {c.name.charAt(0).toUpperCase() || <User className="h-4 w-4" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-[var(--text-primary)]">
                            <Highlight text={c.name} query={q} />
                          </span>
                          {(c.location || c.email) && (
                            <span className="block truncate text-xs text-[var(--text-muted)]">{c.location ?? c.email}</span>
                          )}
                        </span>
                      </>
                    )
                  })}
              </>
            )}

            {results &&
              items
                .filter((it) => it.kind === 'all')
                .map((item) =>
                  row(
                    item,
                    <span className="flex flex-1 items-center gap-2 text-sm font-medium text-primary-600">
                      <ArrowRight className="h-4 w-4" /> {t('seeAllInvoices')} ({results.invoiceTotal})
                    </span>
                  )
                )}
          </ul>

          <div className="hidden items-center gap-4 border-t border-[var(--border)] bg-gray-25 px-3 py-2 text-[11px] text-[var(--text-muted)] dark:bg-dark-elevated sm:flex">
            <span>
              <kbd className="font-sans font-semibold">↑↓</kbd> {t('navigate')}
            </span>
            <span>
              <kbd className="font-sans font-semibold">↵</kbd> {t('open')}
            </span>
            <span>
              <kbd className="font-sans font-semibold">Esc</kbd> {t('close')}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
