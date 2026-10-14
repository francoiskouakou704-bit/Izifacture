'use server'

import { cookies } from 'next/headers'
import { LOCALE_COOKIE, isLocale } from '@/i18n/config'

/** Enregistre la langue choisie (cookie 1 an). Phase 4 : aussi sur le profil utilisateur. */
export async function setLocaleAction(locale: string) {
  if (!isLocale(locale)) return { ok: false as const }
  cookies().set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })
  return { ok: true as const }
}
