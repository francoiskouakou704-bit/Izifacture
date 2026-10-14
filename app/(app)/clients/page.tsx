import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { ClientsView } from '@/components/clients/clients-view'
import { getDataSource } from '@/lib/data'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta')
  return { title: t('clients') }
}

export default async function ClientsPage({ searchParams }: { searchParams: { q?: string; archived?: string } }) {
  const q = searchParams.q?.slice(0, 100) ?? ''
  const showArchived = searchParams.archived === '1'
  const clients = await getDataSource().listClients({ q, includeArchived: showArchived })
  return <ClientsView clients={clients} q={q} showArchived={showArchived} />
}
