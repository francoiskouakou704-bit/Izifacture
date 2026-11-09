import { cn } from '@/lib/utils'
import { mockup } from '../content'
import { FloatingCard } from './floating-card'

/** Aperçu de l'app : fenêtre « tableau de bord » avec indicateurs et une facture. */
export function HeroMockup() {
  const { invoice } = mockup
  const [left, right] = mockup.floating

  return (
    <div id="demo" className="relative mx-auto mt-16 max-w-5xl scroll-mt-28">
      <FloatingCard {...left} className="lp-float-1 -left-6 -top-8" />
      <FloatingCard {...right} className="lp-float-2 -right-6 -top-4" />

      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-4 text-start shadow-floating sm:p-7">
        {/* Barre de fenêtre */}
        <div className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <span aria-hidden className="h-3 w-3 shrink-0 rounded-full bg-rose-400" />
            <span aria-hidden className="h-3 w-3 shrink-0 rounded-full bg-amber-400" />
            <span aria-hidden className="h-3 w-3 shrink-0 rounded-full bg-emerald-400" />
            <span className="ms-2 truncate text-xs font-semibold text-slate-400">{mockup.windowTitle}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{mockup.currency}</span>
            <span className="rounded-full border border-dashed border-slate-200 px-3 py-1 text-xs font-medium text-slate-400">
              {mockup.caption}
            </span>
          </div>
        </div>

        {/* Indicateurs */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {mockup.metrics.map((m) => (
            <div key={m.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="text-xs font-medium text-slate-500">{m.label}</div>
              <div className={cn('mt-1 text-xl font-extrabold sm:text-2xl', m.valueClass)}>{m.value}</div>
              <div className={cn('mt-1 text-xs font-medium', m.noteClass)}>{m.note}</div>
            </div>
          ))}
        </div>

        {/* Facture */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
            <div className="min-w-0">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">{invoice.reference}</span>
              <h3 className="mt-0.5 text-base font-bold text-slate-900">{invoice.title}</h3>
              <p className="text-xs text-slate-500">{invoice.client}</p>
            </div>
            <span className="self-start rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 sm:self-center">
              {invoice.status}
            </span>
          </div>

          <div className="mt-4 text-xs sm:text-sm">
            {invoice.lines.map((line) => (
              <div key={line.label} className="flex justify-between gap-4 border-b border-slate-100 py-2 text-slate-600">
                <span className="flex flex-wrap items-center gap-1.5">
                  {line.label}
                  {'badge' in line && (
                    <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">{line.badge}</span>
                  )}
                </span>
                <span className="shrink-0 font-medium text-slate-800">{line.amount}</span>
              </div>
            ))}
            <div className="flex justify-between gap-4 py-3 text-sm font-extrabold text-slate-900 sm:text-base">
              <span>{invoice.totalLabel}</span>
              <span className="shrink-0 text-base font-bold text-ink sm:text-lg">{invoice.total}</span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-slate-500">
              <span>{invoice.paymentsLabel}</span>
              <span className="font-medium text-slate-700">{invoice.payments}</span>
            </div>
            <span className="font-semibold text-blue-600">{invoice.receipt}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
