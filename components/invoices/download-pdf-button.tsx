'use client'

import { Download } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button, type ButtonProps } from '@/components/ui/button'
import { downloadElementAsPdf, pdfFileName } from '@/lib/pdf'

/**
 * Télécharge la facture affichée sur la page (élément `.invoice-paper`) en PDF A4.
 * `fileBase` : numéro de la facture (ou libellé du brouillon).
 */
export function DownloadPdfButton({
  fileBase,
  variant = 'outline',
  size = 'sm',
  className,
}: {
  fileBase: string
  variant?: ButtonProps['variant']
  size?: ButtonProps['size']
  className?: string
}) {
  const t = useTranslations('invoiceActions')
  const tErrors = useTranslations('errors')
  const [busy, setBusy] = useState(false)

  async function download() {
    const paper = document.querySelector<HTMLElement>('.invoice-paper')
    if (!paper) return
    setBusy(true)
    try {
      await downloadElementAsPdf(paper, pdfFileName(fileBase))
    } catch (err) {
      console.error('[pdf]', err)
      toast.error(tErrors('pdfFailed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button type="button" variant={variant} size={size} className={className} loading={busy} onClick={download}>
      {!busy && <Download className="h-3.5 w-3.5" />} {t('downloadPdf')}
    </Button>
  )
}
