import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { notFound, redirect } from 'next/navigation'
import { InvoiceForm } from '@/components/invoices/invoice-form'
import { getDataSource } from '@/lib/data'
import { requireOrganization } from '@/lib/session'
import { isEditable } from '@/lib/status'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta')
  return { title: t('editInvoice') }
}

export default async function EditInvoicePage({ params }: { params: { id: string } }) {
  const ds = getDataSource()
  const [org, invoice] = await Promise.all([requireOrganization(), ds.getInvoice(params.id)])
  if (!invoice) notFound()
  // Une facture émise est figée : on renvoie vers son détail.
  if (!isEditable(invoice.status)) redirect(`/invoices/${invoice.id}`)

  const clients = await ds.listClients({ includeArchived: true })
  // Clients archivés masqués, sauf celui déjà associé au brouillon
  const options = clients.filter((c) => !c.archivedAt || c.id === invoice.clientId)

  return (
    <div className="animate-fade-in">
      <InvoiceForm organization={org} clients={options} invoice={invoice} />
    </div>
  )
}
