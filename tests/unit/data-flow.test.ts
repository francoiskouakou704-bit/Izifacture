import { beforeEach, describe, expect, it } from 'vitest'
import { mockDataSource as ds, resetMockDb } from '@/lib/data/mock'
import { createSeed } from '@/lib/data/mock/seed'
import { buildInvoiceRecord } from '@/lib/services/invoices'
import type { InvoiceInput } from '@/lib/validations/invoice'
import { invoiceInputSchema } from '@/lib/validations/invoice'
import { clientInputSchema } from '@/lib/validations/client'

const input = (over: Partial<InvoiceInput> = {}): InvoiceInput => ({
  clientId: 'cli_1',
  issueDate: '2026-10-01',
  dueDate: '2026-10-31',
  currency: 'XOF',
  discountType: 'none',
  discountValue: 0,
  items: [{ description: 'Site web', quantity: 2, unitPrice: 250000, taxRate: 18 }],
  ...over,
})

beforeEach(() => resetMockDb(createSeed('2026-10-12')))

describe('validation de la saisie', () => {
  it('refuse une échéance antérieure à l’émission', () => {
    const r = invoiceInputSchema.safeParse(input({ dueDate: '2026-09-01' }))
    expect(r.success).toBe(false)
  })
  it('refuse une facture sans ligne et une quantité nulle', () => {
    expect(invoiceInputSchema.safeParse(input({ items: [] })).success).toBe(false)
    expect(
      invoiceInputSchema.safeParse(input({ items: [{ description: 'x', quantity: 0, unitPrice: 1, taxRate: 0 }] })).success
    ).toBe(false)
  })
})

describe('buildInvoiceRecord', () => {
  it('convertit en unités mineures et recalcule les totaux', () => {
    const r = buildInvoiceRecord(
      input({ currency: 'EUR', discountType: 'fixed', discountValue: 10, items: [{ description: 'A', quantity: 1, unitPrice: 100.5, taxRate: 20 }] })
    )
    expect(r.items[0].unitPrice).toBe(10050)
    expect(r.discountValue).toBe(1000)
    expect(r.subtotal).toBe(10050)
    expect(r.total).toBe(10050 - 1000 + 1810)
  })
})

describe('cycle de vie d’une facture', () => {
  it('brouillon → envoi numéroté → paiement partiel → payée', async () => {
    const org = await ds.getOrganization()
    const draft = await ds.createInvoice(buildInvoiceRecord(input()))
    expect(draft.status).toBe('draft')
    expect(draft.number).toBeNull()
    expect(draft.total).toBe(590000)

    const sent = await ds.sendInvoice(draft.id)
    expect(sent.number).toBe(`INV-2026-${String(org!.nextInvoiceNumber).padStart(4, '0')}`)
    expect(sent.clientSnapshot?.name).toBe('Koffi Anan Consulting')

    // Modifier le client ne change pas la facture émise
    await ds.updateClient('cli_1', clientInputSchema.parse({ name: 'Nouveau nom' }))
    expect((await ds.getInvoice(draft.id))!.clientName).toBe('Koffi Anan Consulting')

    await ds.addPayment(draft.id, { amount: 90000, paidOn: '2026-10-05', method: 'mobile_money' })
    expect((await ds.getInvoice(draft.id))!.status).toBe('sent')
    await expect(ds.addPayment(draft.id, { amount: 600000, paidOn: '2026-10-06', method: 'bank' })).rejects.toThrow()
    await ds.addPayment(draft.id, { amount: 500000, paidOn: '2026-10-06', method: 'bank' })
    const paid = await ds.getInvoice(draft.id)
    expect(paid!.status).toBe('paid')
    expect(paid!.amountPaid).toBe(590000)

    const types = (await ds.listEvents(draft.id)).map((e) => e.type)
    expect(types).toEqual(expect.arrayContaining(['created', 'sent', 'payment']))
  })

  it('numérote séquentiellement sans doublon', async () => {
    const a = await ds.createInvoice(buildInvoiceRecord(input()))
    const b = await ds.createInvoice(buildInvoiceRecord(input()))
    const [sa, sb] = [await ds.sendInvoice(a.id), await ds.sendInvoice(b.id)]
    const n = (s: string | null) => Number(s!.split('-').pop())
    expect(n(sb.number) - n(sa.number)).toBe(1)
  })

  it('interdit de modifier, supprimer ou renvoyer une facture envoyée', async () => {
    const d = await ds.createInvoice(buildInvoiceRecord(input()))
    await ds.sendInvoice(d.id)
    await expect(ds.updateInvoice(d.id, buildInvoiceRecord(input()))).rejects.toThrow()
    await expect(ds.deleteInvoice(d.id)).rejects.toThrow()
    await expect(ds.sendInvoice(d.id)).rejects.toThrow()
  })

  it('un brouillon n’est pas accessible par lien public', async () => {
    const d = await ds.createInvoice(buildInvoiceRecord(input()))
    expect(await ds.getInvoiceByToken(d.publicToken)).toBeNull()
    await ds.sendInvoice(d.id)
    expect(await ds.getInvoiceByToken(d.publicToken)).not.toBeNull()
  })
})

describe('listInvoices', () => {
  it('filtre par statut, recherche et pagine', async () => {
    const all = await ds.listInvoices({ pageSize: 5 })
    expect(all.rows).toHaveLength(5)
    expect(all.total).toBe(all.counts.all)

    const drafts = await ds.listInvoices({ status: 'draft', pageSize: 100 })
    expect(drafts.rows.every((i) => i.status === 'draft')).toBe(true)

    const search = await ds.listInvoices({ q: 'koffi', pageSize: 100 })
    expect(search.rows.every((i) => i.clientName.toLowerCase().includes('koffi'))).toBe(true)
  })
})

describe('dashboard', () => {
  it('reste cohérent avec les factures', async () => {
    const s = await ds.getDashboardStats({ period: 'all' })
    const { rows } = await ds.listInvoices({ pageSize: 1000 })
    const xof = rows.filter((i) => i.currency === 'XOF')
    const pending = xof.filter((i) => i.status === 'sent').reduce((t, i) => t + i.total - i.amountPaid, 0)
    expect(s.currency).toBe('XOF')
    expect(s.totalPending).toBe(pending)
    expect(s.totalOverdue).toBeLessThanOrEqual(s.totalPending)
    expect(s.availableCurrencies).toEqual(expect.arrayContaining(['XOF', 'EUR']))
    // Les montants EUR ne sont jamais additionnés aux XOF
    const invoiced = xof.filter((i) => i.status !== 'draft' && i.status !== 'cancelled').reduce((t, i) => t + i.total, 0)
    expect(s.totalInvoiced).toBe(invoiced)
  })
})
