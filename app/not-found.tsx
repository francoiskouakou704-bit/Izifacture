import { FileQuestion } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

export default function NotFound() {
  const t = useTranslations('states')
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="card w-full max-w-md">
        <EmptyState
          icon={<FileQuestion className="h-6 w-6" />}
          title={t('notFoundTitle')}
          description={t('notFoundDescription')}
          action={
            <Button asChild>
              <Link href="/dashboard">{t('backToDashboard')}</Link>
            </Button>
          }
        />
      </div>
    </div>
  )
}
