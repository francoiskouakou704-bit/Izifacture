import type { Currency } from '@/lib/types'
import { cn } from '@/lib/utils'

// Petits visuels du formulaire de facture : pastille client (initiales) et pastille devise.

const AVATAR_COLORS = [
  'bg-primary-600',
  'bg-emerald-600',
  'bg-amber-500',
  'bg-rose-500',
  'bg-violet-600',
  'bg-cyan-600',
  'bg-orange-500',
  'bg-teal-600',
]

function hash(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const letters = words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? '?').slice(0, 2)
  return letters.toUpperCase()
}

const SIZES = {
  xs: 'h-5 w-5 text-[9px]',
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-xs',
}

export function ClientAvatar({ name, size = 'sm', className }: { name: string; size?: keyof typeof SIZES; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white',
        AVATAR_COLORS[hash(name) % AVATAR_COLORS.length],
        SIZES[size],
        className
      )}
    >
      {initials(name)}
    </span>
  )
}

const CURRENCY_STYLE: Record<Currency, { symbol: string; className: string }> = {
  XOF: { symbol: 'F', className: 'bg-amber-500' },
  XAF: { symbol: 'F', className: 'bg-emerald-600' },
  NGN: { symbol: '₦', className: 'bg-green-600' },
  GHS: { symbol: '₵', className: 'bg-yellow-500' },
  KES: { symbol: 'Sh', className: 'bg-red-600' },
  MAD: { symbol: 'DH', className: 'bg-rose-600' },
  GNF: { symbol: 'FG', className: 'bg-orange-500' },
  CDF: { symbol: 'FC', className: 'bg-sky-600' },
  EUR: { symbol: '€', className: 'bg-blue-700' },
  USD: { symbol: '$', className: 'bg-slate-700' },
}

export function CurrencyBadge({ currency, size = 'sm' }: { currency: Currency; size?: keyof typeof SIZES }) {
  const style = CURRENCY_STYLE[currency] ?? { symbol: currency.slice(0, 1), className: 'bg-gray-500' }
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-bold leading-none text-white',
        style.className,
        SIZES[size]
      )}
    >
      {style.symbol}
    </span>
  )
}
