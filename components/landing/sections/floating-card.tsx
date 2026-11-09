import { cn } from '@/lib/utils'
import { IconTile } from '../ui/icon-tile'
import { toneText, type Tone } from '../ui/tones'

/** Petite carte « notification » qui flotte autour de la maquette (grands écrans). */
export function FloatingCard({
  tone,
  symbol,
  label,
  value,
  detail,
  className,
}: {
  tone: Tone
  symbol: string
  label: string
  value: string
  detail: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'absolute z-20 hidden items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 text-start shadow-floating lg:flex',
        className
      )}
    >
      <IconTile tone={tone} symbol={symbol} size="sm" />
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</div>
        <div className="text-sm font-bold text-slate-900">{value}</div>
        <div className={cn('text-[11px] font-medium', toneText[tone])}>{detail}</div>
      </div>
    </div>
  )
}
