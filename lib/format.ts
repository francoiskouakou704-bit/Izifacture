import { intlLocales, type AppLocale } from '@/i18n/config'
import { formatDate, formatDateTime, formatMonthKey, type DateStyle } from '@/lib/dates'
import { formatAmount, formatMoney, formatMoneyCompact } from '@/lib/money'
import type { Currency } from '@/lib/types'

/** Formateurs liés à une langue. Côté client : useFormat() ; côté serveur : getFormat(). */
export function createFormat(locale: AppLocale) {
  return {
    locale,
    money: (minor: number, currency: Currency) => formatMoney(minor, currency, locale),
    moneyCompact: (minor: number, currency: Currency) => formatMoneyCompact(minor, currency, locale),
    amount: (minor: number, currency: Currency) => formatAmount(minor, currency, locale),
    number: (n: number) => n.toLocaleString(intlLocales[locale]),
    date: (iso: string, style?: DateStyle) => formatDate(iso, style, locale),
    dateLong: (iso: string) => formatDate(iso, 'long', locale),
    dateTime: (iso: string) => formatDateTime(iso, locale),
    month: (key: string) => formatMonthKey(key, locale),
  }
}

export type Format = ReturnType<typeof createFormat>
