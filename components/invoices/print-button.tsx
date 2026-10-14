'use client'

import { Printer } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

export function PrintButton({ label }: { label?: string }) {
  const t = useTranslations('invoiceActions')
  return (
    <Button variant="outline" size="sm" onClick={() => window.print()}>
      <Printer className="h-3.5 w-3.5" /> {label ?? t('printOnly')}
    </Button>
  )
}
