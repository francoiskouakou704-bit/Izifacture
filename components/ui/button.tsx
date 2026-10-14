import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium',
    'transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50 select-none',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-primary-600 text-white shadow-sm',
          'hover:bg-primary-700 active:bg-primary-800',
          'dark:bg-primary-500 dark:hover:bg-primary-400',
        ],
        secondary: [
          'bg-gray-100 text-gray-800 border border-gray-200',
          'hover:bg-gray-200 active:bg-gray-300',
          'dark:bg-dark-elevated dark:text-gray-200 dark:border-dark-border dark:hover:bg-dark-muted',
        ],
        outline: [
          'border border-gray-300 bg-transparent text-gray-700',
          'hover:bg-gray-50 active:bg-gray-100',
          'dark:border-dark-border dark:text-gray-300 dark:hover:bg-dark-elevated',
        ],
        ghost: [
          'bg-transparent text-gray-600',
          'hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200',
          'dark:text-gray-400 dark:hover:bg-dark-elevated dark:hover:text-gray-200',
        ],
        destructive: [
          'bg-danger-600 text-white shadow-sm',
          'hover:bg-danger-700 active:bg-danger-700',
        ],
        'outline-destructive': [
          'border border-danger-300 bg-transparent text-danger-600',
          'hover:bg-danger-50 active:bg-danger-100',
          'dark:border-danger-700 dark:text-danger-400 dark:hover:bg-danger-700/20',
        ],
        success: [
          'bg-success-600 text-white shadow-sm',
          'hover:bg-success-700 active:bg-success-700',
        ],
      },
      size: {
        xs:  'h-7 px-2.5 text-xs rounded-md',
        sm:  'h-8 px-3 text-xs',
        md:  'h-9 px-4',
        lg:  'h-10 px-5 text-base',
        xl:  'h-12 px-6 text-base',
        icon: 'h-9 w-9 p-0',
        'icon-sm': 'h-7 w-7 p-0 rounded-md',
        'icon-lg': 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    // Slot exige un unique enfant : pas de spinner en mode asChild (liens)
    if (asChild) {
      return (
        <Slot className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
          {children}
        </Slot>
      )
    }
    const Comp = 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </Comp>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
