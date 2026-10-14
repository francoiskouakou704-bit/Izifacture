'use client'

import { FilePlus2, Pencil } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { Client } from '@/lib/types'
import { ClientDialog } from './client-dialog'

export function ClientDetailActions({ client }: { client: Client }) {
  const t = useTranslations('clients')
  const [open, setOpen] = useState(false)
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Pencil className="h-3.5 w-3.5" /> {t('edit')}
      </Button>
      {!client.archivedAt && (
        <Button asChild size="sm">
          <Link href={`/invoices/new?client=${client.id}`}>
            <FilePlus2 className="h-3.5 w-3.5" /> {t('newInvoice')}
          </Link>
        </Button>
      )}
      <ClientDialog open={open} onOpenChange={setOpen} client={client} />
    </div>
  )
}
