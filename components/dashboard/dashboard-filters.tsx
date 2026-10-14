'use client'

import { useTranslations } from 'next-intl'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PERIODS } from '@/lib/dashboard'
import type { Currency, DashboardPeriod } from '@/lib/types'

export function DashboardFilters({
  period,
  currency,
  currencies,
}: {
  period: DashboardPeriod
  currency: Currency
  currencies: Currency[]
}) {
  const t = useTranslations('dashboard')
  const tp = useTranslations('periods')
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  function update(key: string, value: string) {
    const next = new URLSearchParams(params)
    next.set(key, value)
    router.replace(`${pathname}?${next}`, { scroll: false })
  }

  return (
    <div className="flex items-center gap-2">
      {currencies.length > 1 && (
        <div className="w-28">
          <Select value={currency} onValueChange={(v) => update('currency', v)}>
            <SelectTrigger aria-label={t('currency')} className="h-8 py-1">
              <SelectValue>{currency}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {currencies.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="w-44">
        <Select value={period} onValueChange={(v) => update('period', v)}>
          <SelectTrigger aria-label={t('period')} className="h-8 py-1">
            <SelectValue>{tp(period)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((p) => (
              <SelectItem key={p} value={p}>
                {tp(p)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
