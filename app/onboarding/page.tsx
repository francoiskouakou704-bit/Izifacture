import { Zap } from 'lucide-react'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { LocaleSwitcher } from '@/components/layout/locale-switcher'
import { OnboardingForm } from '@/components/onboarding/onboarding-form'
import { getOrganization, requireUser } from '@/lib/session'

// Données propres à chaque utilisateur : jamais de pré-rendu statique.
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta')
  return { title: t('onboarding') }
}

export default async function OnboardingPage() {
  await requireUser()
  const [org, t] = await Promise.all([getOrganization(), getTranslations('onboarding')])

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-50 p-4 dark:from-dark-bg dark:via-dark-surface dark:to-dark-bg">
      <LocaleSwitcher className="absolute end-4 top-4" />
      <div className="w-full max-w-xl">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 shadow-md">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-[var(--text-primary)]">
              izi<span className="text-primary-600">facture</span>
            </span>
          </div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">{t('welcome')}</h1>
          <p className="mt-2 text-[var(--text-muted)]">{t('subtitle')}</p>
        </div>
        <OnboardingForm org={org} />
        <p className="mt-4 text-center text-xs text-[var(--text-muted)]">{t('later')}</p>
      </div>
    </div>
  )
}
