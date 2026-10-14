'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useMemo } from 'react'
import type { AppLocale } from '@/i18n/config'
import { createFormat } from '@/lib/format'

export function useFormat() {
  const locale = useLocale() as AppLocale
  return useMemo(() => createFormat(locale), [locale])
}

/**
 * Traduit un message d'erreur venant de zod ou d'une Server Action.
 * Ces messages sont des clés (« validation.required », « errors.invoiceNotFound ») ;
 * un texte qui n'est pas une clé connue est affiché tel quel.
 */
export function useErrorMessage() {
  const t = useTranslations()
  return (message?: string) => {
    if (!message) return undefined
    return t.has(message as never) ? t(message as never) : message
  }
}
