import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages, getTranslations } from 'next-intl/server'
import { Toaster } from 'sonner'
import { textDirection, type AppLocale } from '@/i18n/config'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
})

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta')
  return {
    title: { default: t('title'), template: '%s | izi-facture' },
    description: t('description'),
    keywords: ['facturation', 'facture', 'FCFA', 'Afrique', 'entrepreneur', 'invoice', 'invoicing', 'Africa'],
    openGraph: { title: 'izi-facture', description: t('description'), type: 'website' },
    // L'app gère ses propres langues : la traduction automatique du navigateur
    // abîmerait noms, montants et numéros de facture (ex. « AD » → « Publicité »).
    other: { google: 'notranslate' },
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()])

  return (
    <html lang={locale} dir={textDirection(locale as AppLocale)} translate="no" className="notranslate" suppressHydrationWarning>
      <body className={`${inter.variable} ${plusJakarta.variable} antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages} timeZone="Africa/Abidjan">
          {children}
        </NextIntlClientProvider>
        <Toaster
          position="bottom-right"
          richColors
          toastOptions={{
            style: {
              borderRadius: '12px',
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
            },
          }}
        />
      </body>
    </html>
  )
}
