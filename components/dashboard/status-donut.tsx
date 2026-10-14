'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { DashboardStats } from '@/lib/types'

const COLORS: Record<string, string> = {
  paid: '#2F9E44',
  sent: '#F08C00',
  overdue: '#C92A2A',
  draft: '#ADB5BD',
}

export function StatusDonut({ breakdown }: { breakdown: DashboardStats['statusBreakdown'] }) {
  const t = useTranslations('dashboard')
  const ts = useTranslations('status')
  const data = breakdown.map((b) => ({ ...b, name: ts(b.status), color: COLORS[b.status] }))
  const total = data.reduce((s, d) => s + d.count, 0)
  const empty = [{ name: t('none'), count: 1, color: 'var(--border)' }]

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <ResponsiveContainer width={180} height={180}>
          <PieChart>
            <Pie
              data={total > 0 ? data : empty}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={80}
              paddingAngle={total > 0 ? 3 : 0}
              dataKey="count"
              strokeWidth={0}
            >
              {(total > 0 ? data : empty).map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            {total > 0 && (
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '12px' }}
                formatter={(v) => t('invoiceCount', { count: Number(v) })}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-[var(--text-primary)]">{total}</span>
          <span className="text-xs text-[var(--text-muted)]">{t('invoicesLabel')}</span>
        </div>
      </div>

      <div className="w-full space-y-1">
        {data.map((d) => (
          <Link
            key={d.status}
            href={`/invoices?status=${d.status}`}
            className="flex items-center justify-between rounded-md px-2 py-1 text-sm hover:bg-gray-50 dark:hover:bg-dark-elevated"
          >
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color }} />
              <span className="text-[var(--text-secondary)]">{d.name}</span>
            </span>
            <span className="font-semibold text-[var(--text-primary)]">{d.count}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
