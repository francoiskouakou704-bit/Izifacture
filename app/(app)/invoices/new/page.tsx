import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { InvoiceForm } from '@/components/invoices/invoice-form'
import { getDataSource } from '@/lib/data'
import { requireOrganization } from '@/lib/session'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta')
  return { title: t('newInvoice') }
}

export default async function NewInvoicePage(props: { searchParams: Promise<{ client?: string }> }) {
  const searchParams = await props.searchParams
  const org = await requireOrganization()
  const clients = await getDataSource().listClients()
  const defaultClientId = clients.some((c) => c.id === searchParams.client) ? searchParams.client : undefined

  return (
    <div className="animate-fade-in">
      <InvoiceForm organization={org} clients={clients} defaultClientId={defaultClientId} />
    </div>
  )
}
