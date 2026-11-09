import { cn } from '@/lib/utils'
import { toneTile, type Tone } from './tones'

/** Pastille carrée colorée contenant un symbole (✓, 18%, emoji…). */
export function IconTile({ tone, symbol, size = 'md', className }: { tone: Tone; symbol: string; size?: 'sm' | 'md'; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center font-bold',
        size === 'md' ? 'h-12 w-12 rounded-2xl text-xl' : 'h-10 w-10 rounded-xl text-sm',
        toneTile[tone],
        className
      )}
    >
      {symbol}
    </div>
  )
}
