import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { AuthShell } from '@/components/auth/auth-shell'
import { ResetPasswordForm } from '@/components/auth/password-forms'
import { requireUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth')
  return { title: t('resetTitle') }
}

// Atteinte via le lien « mot de passe oublié » : la session de récupération est déjà ouverte.
export default async function ResetPasswordPage() {
  await requireUser()
  const t = await getTranslations('auth')

  return (
    <AuthShell title={t('resetTitle')} subtitle={t('resetSubtitle')}>
      <ResetPasswordForm />
    </AuthShell>
  )
}
