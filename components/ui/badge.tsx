import { useTranslations } from 'next-intl'
import * as React from 'react'
import { cn } from '@/lib/utils'
import type { InvoiceStatus } from '@/lib/types'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'muted' | InvoiceStatus
  dot?: boolean
}

const variantMap: Record<string, string> = {
  default:   'bg-gray-100 text-gray-700 dark:bg-dark-muted dark:text-gray-400',
  primary:   'bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300',
  success:   'bg-success-50 text-success-700 dark:bg-success-700/20 dark:text-success-500',
  warning:   'bg-warning-50 text-warning-700 dark:bg-warning-700/20 dark:text-warning-500',
  danger:    'bg-danger-50 text-danger-700 dark:bg-danger-700/20 dark:text-danger-500',
  muted:     'bg-gray-100 text-gray-500 dark:bg-dark-muted dark:text-gray-500',
  // Statuts facture
  draft:     'bg-gray-100 text-gray-700 dark:bg-dark-muted dark:text-gray-400',
  sent:      'bg-warning-50 text-warning-700 dark:bg-warning-700/20 dark:text-warning-500',
  paid:      'bg-success-50 text-success-700 dark:bg-success-700/20 dark:text-success-500',
  overdue:   'bg-danger-50 text-danger-700 dark:bg-danger-700/20 dark:text-danger-500',
  cancelled: 'bg-gray-100 text-gray-500 dark:bg-dark-muted dark:text-gray-500',
}

const dotColorMap: Record<string, string> = {
  default:   'bg-gray-500',
  primary:   'bg-primary-600',
  success:   'bg-success-600',
  warning:   'bg-warning-600',
  danger:    'bg-danger-600',
  muted:     'bg-gray-400',
  draft:     'bg-gray-500',
  sent:      'bg-warning-500',
  paid:      'bg-success-600',
  overdue:   'bg-danger-600',
  cancelled: 'bg-gray-400',
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', dot = false, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'badge',
          variantMap[variant] ?? variantMap.default,
          className
        )}
        {...props}
      >
        {dot && (
          <span className={cn('h-1.5 w-1.5 rounded-full', dotColorMap[variant] ?? dotColorMap.default)} />
        )}
        {children}
      </span>
    )
  }
)
Badge.displayName = 'Badge'

// Badge de statut de facture (utilisable côté serveur et client)
export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const t = useTranslations('status')
  return (
    <Badge variant={status} dot>
      {t(status)}
    </Badge>
  )
}

export { Badge }
