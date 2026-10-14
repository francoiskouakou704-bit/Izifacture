import { describe, expect, it } from 'vitest'
import { periodRange } from '@/lib/dashboard'

describe('periodRange', () => {
  it('mois courant vs même nombre de jours le mois précédent', () => {
    expect(periodRange('month', '2026-10-12')).toEqual({
      from: '2026-10-01', to: '2026-10-12', prevFrom: '2026-09-01', prevTo: '2026-09-12',
    })
  })
  it('3 derniers mois, mois courant inclus', () => {
    expect(periodRange('3m', '2026-10-12').from).toBe('2026-08-01')
    expect(periodRange('3m', '2026-10-12').prevFrom).toBe('2026-05-01')
  })
  it('année, passage d’année', () => {
    expect(periodRange('6m', '2026-02-15').from).toBe('2025-09-01')
    expect(periodRange('year', '2026-02-15')).toMatchObject({ from: '2026-01-01', prevFrom: '2025-01-01', prevTo: '2025-02-15' })
  })
  it('tout : pas de période de comparaison', () => {
    expect(periodRange('all', '2026-10-12')).toMatchObject({ from: null, prevFrom: null })
  })
})
