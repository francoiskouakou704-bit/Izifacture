import { getRequestConfig } from 'next-intl/server'
import { cookies, headers } from 'next/headers'
import { LOCALE_COOKIE, isLocale, matchAcceptLanguage } from './config'

// Langue sans préfixe d'URL : cookie choisi par l'utilisateur, sinon langue du navigateur.
export default getRequestConfig(async () => {
  const fromCookie = cookies().get(LOCALE_COOKIE)?.value
  const locale = isLocale(fromCookie) ? fromCookie : matchAcceptLanguage(headers().get('accept-language'))

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: 'Africa/Abidjan', // UTC+0 ; les dates métier sont des dates ISO sans heure
  }
})
