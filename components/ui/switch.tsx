'use client'

import * as React from 'react'
import * as SwitchPrimitives from '@radix-ui/react-switch'
import { cn } from '@/lib/utils'

interface SwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
  label?: string
  description?: string
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ className, label, description, id, ...props }, ref) => {
  const autoId = React.useId()
  const switchId = id ?? autoId
  return (
    <div className="flex items-center gap-3">
      <SwitchPrimitives.Root
        className={cn(
          'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent',
          'transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'data-[state=checked]:bg-primary-600 data-[state=unchecked]:bg-gray-300',
          'dark:data-[state=unchecked]:bg-dark-muted',
          className
        )}
        id={switchId}
        ref={ref}
        {...props}
      >
        <SwitchPrimitives.Thumb
          className={cn(
            'pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm ring-0',
            'transition-transform duration-200',
            'data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0 rtl:data-[state=checked]:-translate-x-4'
          )}
        />
      </SwitchPrimitives.Root>
      {(label || description) && (
        <label htmlFor={switchId} className="cursor-pointer">
          {label && <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>}
          {description && <p className="text-xs text-[var(--text-muted)] mt-0.5">{description}</p>}
        </label>
      )}
    </div>
  )
})
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
