import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function FormAlert({ tone = 'error', children }: { tone?: 'error' | 'success'; children: React.ReactNode }) {
  const Icon = tone === 'error' ? AlertCircle : CheckCircle2
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm',
        tone === 'error'
          ? 'border-danger-100 bg-danger-50 text-danger-700 dark:border-danger-700/40 dark:bg-danger-700/10 dark:text-danger-500'
          : 'border-success-100 bg-success-50 text-success-700 dark:border-success-700/40 dark:bg-success-700/10 dark:text-success-500'
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  )
}
