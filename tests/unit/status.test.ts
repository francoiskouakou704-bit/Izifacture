import { describe, expect, it } from 'vitest'
import { canTransition, getEffectiveStatus } from '@/lib/status'

const base = { dueDate: '2026-10-10', amountPaid: 0, total: 1000 }

describe('getEffectiveStatus', () => {
  it('envoyée et échéance dépassée → en retard', () => {
    expect(getEffectiveStatus({ ...base, status: 'sent' }, '2026-10-11')).toBe('overdue')
  })
  it('le jour de l’échéance n’est pas encore en retard', () => {
    expect(getEffectiveStatus({ ...base, status: 'sent' }, '2026-10-10')).toBe('sent')
  })
  it('brouillon, payée et annulée ne sont jamais en retard', () => {
    for (const status of ['draft', 'paid', 'cancelled'] as const) {
      expect(getEffectiveStatus({ ...base, status }, '2027-01-01')).toBe(status)
    }
  })
})

describe('canTransition', () => {
  it('autorise le cycle de vie normal', () => {
    expect(canTransition('draft', 'sent')).toBe(true)
    expect(canTransition('sent', 'paid')).toBe(true)
    expect(canTransition('sent', 'cancelled')).toBe(true)
  })
  it('interdit les retours en arrière', () => {
    expect(canTransition('paid', 'sent')).toBe(false)
    expect(canTransition('sent', 'draft')).toBe(false)
    expect(canTransition('cancelled', 'sent')).toBe(false)
    expect(canTransition('draft', 'paid')).toBe(false)
  })
})
