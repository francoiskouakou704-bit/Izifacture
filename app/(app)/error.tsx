'use client'

import { AlertTriangle, RotateCcw } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations('states')
  const tc = useTranslations('common')

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="card">
      <EmptyState
        icon={<AlertTriangle className="h-6 w-6 text-danger-600" />}
        title={t('errorTitle')}
        description={t('errorDescription')}
        action={
          <Button onClick={reset}>
            <RotateCcw className="h-4 w-4" /> {tc('retry')}
          </Button>
        }
      />
    </div>
  )
}
