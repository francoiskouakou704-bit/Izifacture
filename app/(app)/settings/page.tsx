import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { SettingsView } from '@/components/settings/settings-view'
import { requireOrganization, requireUser } from '@/lib/session'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta')
  return { title: t('settings') }
}

export default async function SettingsPage() {
  const [org, user] = await Promise.all([requireOrganization(), requireUser()])
  return <SettingsView org={org} user={user} />
}
