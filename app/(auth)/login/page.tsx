import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { AuthShell } from '@/components/auth/auth-shell'
import { GoogleButton } from '@/components/auth/google-button'
import { LoginForm } from '@/components/auth/login-form'
import { safeNextPath } from '@/lib/validations/auth'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta')
  return { title: t('login') }
}

export default async function LoginPage(props: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const searchParams = await props.searchParams
  const t = await getTranslations('auth')
  const next = safeNextPath(searchParams.next)

  return (
    <AuthShell
      title={t('welcomeBack')}
      subtitle={t('loginSubtitle')}
      footer={
        <>
          {t('noAccount')}{' '}
          <Link href="/signup" className="font-medium text-primary-600 hover:text-primary-700">
            {t('createAccount')}
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        <LoginForm next={next} linkError={searchParams.error === 'link'} />
        <GoogleButton next={next} />
      </div>
    </AuthShell>
  )
}
