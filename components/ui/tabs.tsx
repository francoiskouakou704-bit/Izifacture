'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex h-9 items-center gap-1 rounded-lg bg-gray-100 dark:bg-dark-elevated p-1',
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium',
      'text-[var(--text-muted)] transition-all duration-150',
      'hover:text-[var(--text-primary)]',
      'disabled:pointer-events-none disabled:opacity-50',
      'data-[state=active]:bg-[var(--bg-card)] data-[state=active]:text-[var(--text-primary)]',
      'data-[state=active]:shadow-xs data-[state=active]:font-semibold',
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600',
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

// Underline variant (for invoice filter tabs)
const TabsListUnderline = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex items-center border-b border-[var(--border)] gap-0',
      className
    )}
    {...props}
  />
))
TabsListUnderline.displayName = 'TabsListUnderline'

const TabsTriggerUnderline = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & { count?: number }
>(({ className, children, count, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'relative flex shrink-0 items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-all duration-150 sm:gap-2 sm:px-4',
      'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
      'border-b-2 border-transparent -mb-px',
      'data-[state=active]:text-primary-600 data-[state=active]:border-primary-600',
      'dark:data-[state=active]:text-primary-400 dark:data-[state=active]:border-primary-400',
      'disabled:pointer-events-none disabled:opacity-40',
      className
    )}
    {...props}
  >
    {children}
    {count !== undefined && (
      <span className={cn(
        'rounded-full px-1.5 py-0.5 text-xs font-semibold',
        'bg-gray-100 text-gray-600 dark:bg-dark-muted dark:text-gray-400',
        'group-data-[state=active]:bg-primary-50 group-data-[state=active]:text-primary-700',
      )}>
        {count}
      </span>
    )}
  </TabsPrimitive.Trigger>
))
TabsTriggerUnderline.displayName = 'TabsTriggerUnderline'

export { Tabs, TabsList, TabsTrigger, TabsContent, TabsListUnderline, TabsTriggerUnderline }
