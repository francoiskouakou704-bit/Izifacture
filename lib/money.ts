import { defaultLocale, intlLocales, type AppLocale } from '@/i18n/config'
import { CURRENCY_DECIMALS, type Currency } from '@/lib/types'

// Tous les montants sont stockés en unités mineures (entiers).
// XOF/XAF/GNF/CDF n'ont pas de sous-unité : 1 unité mineure = 1 franc.

export function minorFactor(currency: Currency): number {
  return 10 ** CURRENCY_DECIMALS[currency]
}

/** Montant saisi par l'utilisateur (unités majeures) → entier en unités mineures. */
export function toMinor(amount: number, currency: Currency): number {
  if (!Number.isFinite(amount)) return 0
  // toFixed évite les erreurs flottantes du type 19.99 * 100 = 1998.9999…
  const factor = minorFactor(currency)
  return Math.round(Number((amount * factor).toFixed(6)))
}

/** Entier en unités mineures → nombre en unités majeures (pour les champs de saisie). */
export function fromMinor(minor: number, currency: Currency): number {
  return minor / minorFactor(currency)
}

const formatters = new Map<string, Intl.NumberFormat>()

function getFormatter(currency: Currency, compact: boolean, locale: AppLocale) {
  const key = `${locale}-${currency}-${compact}`
  let f = formatters.get(key)
  if (!f) {
    const decimals = CURRENCY_DECIMALS[currency]
    f = new Intl.NumberFormat(intlLocales[locale], {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: compact ? 0 : decimals,
      maximumFractionDigits: compact ? 1 : decimals,
      notation: compact ? 'compact' : 'standard',
    })
    formatters.set(key, f)
  }
  return f
}

/** 450000 (XOF) → « 450 000 F CFA » ; 250050 (USD) → « 2 500,50 $US » */
export function formatMoney(minor: number, currency: Currency, locale: AppLocale = defaultLocale): string {
  return normalizeSpaces(getFormatter(currency, false, locale).format(fromMinor(minor, currency)))
}

/** Version courte pour graphiques et cartes : « 1,2 M F CFA » */
export function formatMoneyCompact(minor: number, currency: Currency, locale: AppLocale = defaultLocale): string {
  return normalizeSpaces(getFormatter(currency, true, locale).format(fromMinor(minor, currency)))
}

/** Nombre sans symbole monétaire : 450000 → « 450 000 » */
export function formatAmount(minor: number, currency: Currency, locale: AppLocale = defaultLocale): string {
  const decimals = CURRENCY_DECIMALS[currency]
  return normalizeSpaces(
    new Intl.NumberFormat(intlLocales[locale], {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(fromMinor(minor, currency))
  )
}

// Intl utilise des espaces insécables fines (U+202F) qui s'affichent mal dans certaines polices.
function normalizeSpaces(s: string) {
  return s.replace(/ /g, ' ')
}
