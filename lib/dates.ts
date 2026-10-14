import { defaultLocale, intlLocales, type AppLocale } from '@/i18n/config'
import { todayISO } from '@/lib/status'

// Formatage des dates via Intl : couvre toutes les langues de l'app (swahili, yoruba, wolof…).

/** Parse une date ISO « YYYY-MM-DD » en heure locale (évite le décalage UTC de `new Date(str)`). */
export function parseISODate(isoDate: string): Date {
  const [y, m, d] = isoDate.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(isoDate: string, days: number): string {
  const d = parseISODate(isoDate)
  d.setDate(d.getDate() + days)
  return todayISO(d)
}

export function daysBetween(fromISO: string, toISO: string): number {
  return Math.round((parseISODate(toISO).getTime() - parseISODate(fromISO).getTime()) / 86_400_000)
}

export type DateStyle = 'medium' | 'long' | 'dayMonth' | 'monthYear'

const DATE_OPTIONS: Record<DateStyle, Intl.DateTimeFormatOptions> = {
  medium: { day: 'numeric', month: 'short', year: 'numeric' }, // 12 oct. 2026
  long: { day: 'numeric', month: 'long', year: 'numeric' }, // 12 octobre 2026
  dayMonth: { day: 'numeric', month: 'short' }, // 12 oct.
  monthYear: { month: 'short', year: '2-digit' }, // oct. 26
}

const cache = new Map<string, Intl.DateTimeFormat>()
function formatter(locale: AppLocale, key: string, options: Intl.DateTimeFormatOptions) {
  const id = `${locale}|${key}`
  let f = cache.get(id)
  if (!f) {
    f = new Intl.DateTimeFormat(intlLocales[locale], options)
    cache.set(id, f)
  }
  return f
}

export function formatDate(isoDate: string, style: DateStyle = 'medium', locale: AppLocale = defaultLocale): string {
  return formatter(locale, style, DATE_OPTIONS[style]).format(parseISODate(isoDate))
}

/** Date + heure d'un horodatage ISO complet. */
export function formatDateTime(isoDateTime: string, locale: AppLocale = defaultLocale): string {
  return formatter(locale, 'dateTime', { ...DATE_OPTIONS.medium, hour: '2-digit', minute: '2-digit' }).format(new Date(isoDateTime))
}

/** Clé de mois « 2026-10 » → « oct. 26 » (graphiques). */
export function formatMonthKey(key: string, locale: AppLocale = defaultLocale): string {
  return formatDate(`${key}-01`, 'monthYear', locale)
}
