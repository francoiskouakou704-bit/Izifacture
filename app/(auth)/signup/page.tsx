import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { AuthShell } from '@/components/auth/auth-shell'
import { GoogleButton } from '@/components/auth/google-button'
import { SignupForm } from '@/components/auth/signup-form'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta')
  return { title: t('signup') }
}

export default async function SignupPage() {
  const t = await getTranslations('auth')

  return (
    <AuthShell
      title={t('signupTitle')}
      subtitle={t('signupSubtitle')}
      footer={
        <>
          {t('haveAccount')}{' '}
          <Link href="/login" className="font-medium text-primary-600 hover:text-primary-700">
            {t('login')}
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        <SignupForm />
        <GoogleButton next="/onboarding" />
      </div>
    </AuthShell>
  )
}
