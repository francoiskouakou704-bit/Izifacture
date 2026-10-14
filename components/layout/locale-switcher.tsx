'use client'

import * as Popover from '@radix-ui/react-popover'
import { Check, Globe, Search } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { setLocaleAction } from '@/actions/locale'
import { localeInfo, locales, textDirection, type AppLocale } from '@/i18n/config'
import { cn } from '@/lib/utils'

function useChangeLocale() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const change = (next: AppLocale) =>
    startTransition(async () => {
      await setLocaleAction(next)
      document.documentElement.lang = next
      document.documentElement.dir = textDirection(next)
      router.refresh()
    })
  return { pending, change }
}

// Retire les accents (« Français » → « francais ») pour une recherche tolérante
const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Liste des langues avec recherche (par nom natif, nom anglais ou code). */
function LanguageList({
  current,
  onSelect,
  disabled,
  autoFocus,
  className,
}: {
  current: AppLocale
  onSelect: (l: AppLocale) => void
  disabled?: boolean
  autoFocus?: boolean
  className?: string
}) {
  const t = useTranslations('nav')
  const [query, setQuery] = useState('')

  const groups = useMemo(() => {
    const q = normalize(query.trim())
    const match = (l: AppLocale) =>
      !q || [localeInfo[l].name, localeInfo[l].english, l].some((v) => normalize(v).includes(q))
    const filtered = locales.filter(match)
    return [
      { label: t('languageAfrica'), items: filtered.filter((l) => 'african' in localeInfo[l]) },
      { label: t('languageWorld'), items: filtered.filter((l) => !('african' in localeInfo[l])) },
    ].filter((g) => g.items.length > 0)
  }, [query, t])

  return (
    <div className={className}>
      <div className="relative mb-2">
        <Search className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus={autoFocus}
          placeholder={t('languageSearch')}
          aria-label={t('languageSearch')}
          className="input-base h-9 ps-8 text-sm"
        />
      </div>
      <div role="listbox" aria-label={t('language')} className="max-h-72 overflow-y-auto pe-1">
        {groups.length === 0 && <p className="px-2 py-6 text-center text-sm text-[var(--text-muted)]">{t('languageNone')}</p>}
        {groups.map((group) => (
          <div key={group.label} className="mb-1">
            <p className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{group.label}</p>
            {group.items.map((l) => (
              <button
                key={l}
                type="button"
                role="option"
                aria-selected={l === current}
                disabled={disabled}
                lang={l}
                dir={textDirection(l)}
                onClick={() => onSelect(l)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start text-sm transition-colors',
                  l === current
                    ? 'bg-primary-50 font-medium text-primary-700 dark:bg-primary-950/60 dark:text-primary-300'
                    : 'text-[var(--text-primary)] hover:bg-gray-100 dark:hover:bg-dark-elevated'
                )}
              >
                <span className="w-7 shrink-0 text-[10px] font-semibold uppercase text-[var(--text-muted)]">{l}</span>
                <span className="min-w-0 flex-1 truncate">{localeInfo[l].name}</span>
                {localeInfo[l].name !== localeInfo[l].english && (
                  <span className="hidden truncate text-xs text-[var(--text-muted)] sm:inline" dir="ltr">
                    {localeInfo[l].english}
                  </span>
                )}
                {l === current && <Check className="h-4 w-4 shrink-0 text-primary-600" />}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Sélecteur de langue.
 * - `sidebar` : entrée de menu dans la barre latérale
 * - `compact` : petit bouton (pages publiques, connexion)
 * - `inline` : liste intégrée (paramètres)
 */
export function LocaleSwitcher({ variant = 'compact', className }: { variant?: 'sidebar' | 'compact' | 'inline'; className?: string }) {
  const locale = useLocale() as AppLocale
  const t = useTranslations('nav')
  const { pending, change } = useChangeLocale()
  const [open, setOpen] = useState(false)

  const select = (l: AppLocale) => {
    setOpen(false)
    if (l !== locale) change(l)
  }

  if (variant === 'inline') {
    return <LanguageList current={locale} onSelect={select} disabled={pending} className={cn('max-w-md', className)} />
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        {variant === 'sidebar' ? (
          <button type="button" className={cn('nav-item w-full', className)} disabled={pending}>
            <Globe className={cn('h-4 w-4 shrink-0', pending && 'animate-spin-slow')} />
            <span>{t('language')}</span>
            <span className="ms-auto truncate text-xs font-medium text-[var(--text-muted)]">{localeInfo[locale].name}</span>
          </button>
        ) : (
          <button
            type="button"
            disabled={pending}
            aria-label={t('language')}
            className={cn(
              'flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]',
              className
            )}
          >
            <Globe className={cn('h-3.5 w-3.5', pending && 'animate-spin-slow')} />
            <span className="uppercase">{locale}</span>
          </button>
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side={variant === 'sidebar' ? 'top' : 'bottom'}
          align={variant === 'sidebar' ? 'start' : 'end'}
          sideOffset={6}
          collisionPadding={12}
          className="z-50 w-72 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-2 shadow-lg motion-safe:animate-dropdown-in"
        >
          <LanguageList current={locale} onSelect={select} disabled={pending} autoFocus />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
