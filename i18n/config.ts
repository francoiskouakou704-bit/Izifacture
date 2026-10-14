// Langues disponibles. Ajouter une langue = l'ajouter ici + créer messages/<code>.json
// (tests/unit/i18n.test.ts vérifie que toutes les langues ont les mêmes clés).

interface LocaleInfo {
  /** Nom dans la langue elle-même (affiché dans le sélecteur). */
  name: string
  /** Nom en anglais, pour la recherche dans le sélecteur. */
  english: string
  /** Locale Intl pour les nombres, montants et dates. */
  intl: string
  /** Écriture de droite à gauche. */
  rtl?: boolean
  /** Langue parlée principalement en Afrique (mise en avant dans le sélecteur). */
  african?: boolean
}

export const localeInfo = {
  // ── Afrique ──────────────────────────────────────────────
  fr: { name: 'Français', english: 'French', intl: 'fr-FR', african: true },
  en: { name: 'English', english: 'English', intl: 'en-GB', african: true }, // jour/mois, comme au Nigeria, Ghana, Kenya
  ar: { name: 'العربية', english: 'Arabic', intl: 'ar', rtl: true, african: true },
  pt: { name: 'Português', english: 'Portuguese', intl: 'pt-PT', african: true },
  sw: { name: 'Kiswahili', english: 'Swahili', intl: 'sw', african: true },
  ha: { name: 'Hausa', english: 'Hausa', intl: 'ha', african: true },
  yo: { name: 'Yorùbá', english: 'Yoruba', intl: 'yo', african: true },
  ig: { name: 'Igbo', english: 'Igbo', intl: 'ig', african: true },
  am: { name: 'አማርኛ', english: 'Amharic', intl: 'am', african: true },
  so: { name: 'Soomaali', english: 'Somali', intl: 'so', african: true },
  zu: { name: 'isiZulu', english: 'Zulu', intl: 'zu', african: true },
  xh: { name: 'isiXhosa', english: 'Xhosa', intl: 'xh', african: true },
  af: { name: 'Afrikaans', english: 'Afrikaans', intl: 'af', african: true },
  wo: { name: 'Wolof', english: 'Wolof', intl: 'wo', african: true },
  ln: { name: 'Lingála', english: 'Lingala', intl: 'ln', african: true },
  rw: { name: 'Kinyarwanda', english: 'Kinyarwanda', intl: 'rw', african: true },
  mg: { name: 'Malagasy', english: 'Malagasy', intl: 'mg', african: true },
  // ── Reste du monde ───────────────────────────────────────
  es: { name: 'Español', english: 'Spanish', intl: 'es-ES' },
  de: { name: 'Deutsch', english: 'German', intl: 'de-DE' },
  it: { name: 'Italiano', english: 'Italian', intl: 'it-IT' },
  nl: { name: 'Nederlands', english: 'Dutch', intl: 'nl-NL' },
  ru: { name: 'Русский', english: 'Russian', intl: 'ru-RU' },
  uk: { name: 'Українська', english: 'Ukrainian', intl: 'uk-UA' },
  pl: { name: 'Polski', english: 'Polish', intl: 'pl-PL' },
  ro: { name: 'Română', english: 'Romanian', intl: 'ro-RO' },
  el: { name: 'Ελληνικά', english: 'Greek', intl: 'el-GR' },
  sv: { name: 'Svenska', english: 'Swedish', intl: 'sv-SE' },
  tr: { name: 'Türkçe', english: 'Turkish', intl: 'tr-TR' },
  he: { name: 'עברית', english: 'Hebrew', intl: 'he-IL', rtl: true },
  fa: { name: 'فارسی', english: 'Persian', intl: 'fa-IR', rtl: true },
  ur: { name: 'اردو', english: 'Urdu', intl: 'ur-PK', rtl: true },
  hi: { name: 'हिन्दी', english: 'Hindi', intl: 'hi-IN' },
  bn: { name: 'বাংলা', english: 'Bengali', intl: 'bn-BD' },
  zh: { name: '中文', english: 'Chinese', intl: 'zh-CN' },
  ja: { name: '日本語', english: 'Japanese', intl: 'ja-JP' },
  ko: { name: '한국어', english: 'Korean', intl: 'ko-KR' },
  vi: { name: 'Tiếng Việt', english: 'Vietnamese', intl: 'vi-VN' },
  th: { name: 'ไทย', english: 'Thai', intl: 'th-TH' },
  id: { name: 'Bahasa Indonesia', english: 'Indonesian', intl: 'id-ID' },
  ms: { name: 'Bahasa Melayu', english: 'Malay', intl: 'ms-MY' },
} as const satisfies Record<string, LocaleInfo>

export type AppLocale = keyof typeof localeInfo
export const locales = Object.keys(localeInfo) as AppLocale[]

export const defaultLocale: AppLocale = 'fr'
export const LOCALE_COOKIE = 'NEXT_LOCALE'

export const localeNames = Object.fromEntries(locales.map((l) => [l, localeInfo[l].name])) as Record<AppLocale, string>
export const intlLocales = Object.fromEntries(locales.map((l) => [l, localeInfo[l].intl])) as Record<AppLocale, string>

export function isLocale(value: unknown): value is AppLocale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value)
}

export function isRtl(locale: AppLocale): boolean {
  return 'rtl' in localeInfo[locale] && localeInfo[locale].rtl === true
}

export const textDirection = (locale: AppLocale) => (isRtl(locale) ? 'rtl' : 'ltr')

/** Choisit la meilleure langue depuis l'en-tête Accept-Language (« pt-BR » → « pt »). */
export function matchAcceptLanguage(header: string | null | undefined): AppLocale {
  if (!header) return defaultLocale
  const prefs = header
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().split(';q=')
      return { lang: tag.toLowerCase().split('-')[0], q: q ? Number(q) : 1 }
    })
    .sort((a, b) => b.q - a.q)
  return (prefs.find((p) => isLocale(p.lang))?.lang as AppLocale | undefined) ?? defaultLocale
}
