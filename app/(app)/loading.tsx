import { getTranslations } from 'next-intl/server'
import { Skeleton, SkeletonCard, SkeletonTable } from '@/components/ui/skeleton'

export default async function AppLoading() {
  const t = await getTranslations('common')
  return (
    <div className="space-y-6" aria-busy="true" aria-label={t('loading')}>
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <SkeletonTable rows={6} cols={5} />
    </div>
  )
}
