import { describe, expect, it } from 'vitest'
import { formatMoney, fromMinor, toMinor } from '@/lib/money'

describe('toMinor / fromMinor', () => {
  it('XOF n’a pas de décimales', () => {
    expect(toMinor(450000, 'XOF')).toBe(450000)
    expect(toMinor(1499.6, 'XOF')).toBe(1500)
    expect(fromMinor(450000, 'XOF')).toBe(450000)
  })

  it('USD/EUR ont 2 décimales, sans erreur flottante', () => {
    expect(toMinor(19.99, 'USD')).toBe(1999)
    expect(toMinor(0.1 + 0.2, 'EUR')).toBe(30)
    expect(toMinor(1.005, 'EUR')).toBe(101)
    expect(fromMinor(250050, 'USD')).toBe(2500.5)
  })

  it('valeurs non finies → 0', () => {
    expect(toMinor(NaN, 'XOF')).toBe(0)
    expect(toMinor(Infinity, 'USD')).toBe(0)
  })
})

describe('formatMoney', () => {
  it('formate le FCFA sans décimales', () => {
    expect(formatMoney(450000, 'XOF')).toMatch(/^450\u00a0000\u00a0F\u00a0?CFA$/)
  })
  it('formate l’euro avec 2 décimales', () => {
    expect(formatMoney(250050, 'EUR')).toBe('2\u00a0500,50\u00a0€')
  })
})
