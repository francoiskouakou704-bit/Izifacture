import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { AuthPanel } from '@/components/auth/auth-panel'
import { AuthShell } from '@/components/auth/auth-shell'
import { safeNextPath } from '@/lib/validations/auth'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta')
  return { title: t('login') }
}

export default async function LoginPage(props: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const searchParams = await props.searchParams
  const t = await getTranslations('auth')

  return (
    <AuthShell title="IziFacture" subtitle={t('tagline')} inCard>
      <AuthPanel defaultTab="login" next={safeNextPath(searchParams.next)} linkError={searchParams.error === 'link'} />
    </AuthShell>
  )
}
