import 'server-only'
import { getLocale } from 'next-intl/server'
import type { AppLocale } from '@/i18n/config'
import { createFormat } from '@/lib/format'

export async function getFormat() {
  return createFormat((await getLocale()) as AppLocale)
}
