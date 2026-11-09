import Link from 'next/link'
import { cn } from '@/lib/utils'
import { brand } from '../content'

/** Logo iziFacture (pastille « iF » + nom), avec badge de région en option. */
export function Logo({ withBadge = false, size = 'md', className }: { withBadge?: boolean; size?: 'sm' | 'md'; className?: string }) {
  return (
    <Link href="/" className={cn('group flex items-center gap-2.5', className)} aria-label={brand.name}>
      <span
        className={cn(
          'flex items-center justify-center bg-ink font-bold text-white shadow-sm transition-transform duration-300 group-hover:rotate-[-6deg]',
          size === 'md' ? 'h-9 w-9 rounded-xl text-lg' : 'h-8 w-8 rounded-lg text-sm'
        )}
      >
        {brand.initials}
      </span>
      <span className={cn('font-bold tracking-tight text-ink', size === 'md' ? 'text-xl' : 'text-lg')}>{brand.name}</span>
      {withBadge && (
        <span className="hidden rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700 sm:inline-flex">
          {brand.region}
        </span>
      )}
    </Link>
  )
}
