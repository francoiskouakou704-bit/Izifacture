import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, hint, error, id, ...props }, ref) => {
    const autoId = React.useId()
    const inputId = id ?? autoId
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="label">
            {label}
          </label>
        )}
        <textarea
          id={inputId}
          className={cn(
            'input-base resize-none min-h-[80px]',
            error && 'border-danger-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {hint && !error && <p className="mt-1 text-xs text-[var(--text-muted)]">{hint}</p>}
        {error && <p className="mt-1 text-xs text-danger-600 dark:text-danger-400">{error}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
