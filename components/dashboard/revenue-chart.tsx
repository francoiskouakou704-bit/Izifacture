'use client'

import { useTranslations } from 'next-intl'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useFormat } from '@/lib/i18n/client'
import type { Currency, MonthlyRevenue } from '@/lib/types'

export function RevenueChart({ data, currency }: { data: MonthlyRevenue[]; currency: Currency }) {
  const t = useTranslations('dashboard')
  const fmt = useFormat()

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="invoiced" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B5BDB" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#3B5BDB" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="collected" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2F9E44" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#2F9E44" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="month"
          tickFormatter={(key: string) => fmt.month(key)}
          tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => fmt.moneyCompact(v, currency)}
          width={72}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            fontSize: '12px',
            color: 'var(--text-primary)',
            boxShadow: 'var(--shadow-md)',
          }}
          labelFormatter={(key) => fmt.month(String(key))}
          formatter={(v) => fmt.money(Number(v ?? 0), currency)}
        />
        <Area type="monotone" dataKey="invoiced" name={t('chartInvoiced')} stroke="#3B5BDB" strokeWidth={2} fill="url(#invoiced)" dot={false} activeDot={{ r: 4, fill: '#3B5BDB' }} />
        <Area type="monotone" dataKey="collected" name={t('chartCollected')} stroke="#2F9E44" strokeWidth={2} fill="url(#collected)" dot={false} activeDot={{ r: 4, fill: '#2F9E44' }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
