import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  error?: string
  label?: string
  hint?: string
  /** `floating` : label affiché à l'intérieur de la bordure, au-dessus de la valeur. */
  variant?: 'default' | 'floating'
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, leftIcon, rightIcon, error, label, hint, id, variant = 'default', ...props }, ref) => {
    const autoId = React.useId()
    const inputId = id ?? autoId
    const messages = (
      <>
        {hint && !error && <p className="mt-1 text-xs text-[var(--text-muted)]">{hint}</p>}
        {error && <p className="mt-1 text-xs text-danger-600 dark:text-danger-400">{error}</p>}
      </>
    )

    if (variant === 'floating') {
      return (
        <div className="w-full">
          <div
            className={cn(
              'field-floating',
              props.readOnly && 'field-readonly',
              error && 'field-error',
              className
            )}
          >
            {label && (
              <label htmlFor={inputId} className="field-label">
                {label}
              </label>
            )}
            {leftIcon && <span className="flex shrink-0 text-[var(--text-muted)]">{leftIcon}</span>}
            <input
              id={inputId}
              type={type}
              aria-invalid={error ? true : undefined}
              className="field-control"
              ref={ref}
              {...props}
            />
            {rightIcon && <span className="flex shrink-0 text-[var(--text-muted)]">{rightIcon}</span>}
          </div>
          {messages}
        </div>
      )
    }

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="label">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-[var(--text-muted)]">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            className={cn(
              'input-base',
              leftIcon && 'ps-9',
              rightIcon && 'pe-9',
              error && 'border-danger-500 focus:border-danger-500 focus:shadow-ring-danger',
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3 text-[var(--text-muted)]">
              {rightIcon}
            </div>
          )}
        </div>
        {messages}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
