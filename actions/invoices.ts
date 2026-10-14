'use server'

import { revalidatePath } from 'next/cache'
import { DomainError, getDataSource } from '@/lib/data'
import { toMinor } from '@/lib/money'
import { buildInvoiceRecord, duplicateRecord } from '@/lib/services/invoices'
import { canRecordPayment, todayISO } from '@/lib/status'
import { invoiceInputSchema, paymentInputSchema } from '@/lib/validations/invoice'
import { runAction } from './utils'

function revalidate() {
  revalidatePath('/', 'layout')
}

async function requireInvoice(id: string) {
  const inv = await getDataSource().getInvoice(id)
  if (!inv) throw new DomainError('errors.invoiceNotFound')
  return inv
}

/** Crée ou met à jour un brouillon, puis l'envoie si `send` est vrai. */
export async function saveInvoiceAction(rawInput: unknown, opts: { id?: string; send: boolean }) {
  return runAction(async () => {
    const ds = getDataSource()
    const input = invoiceInputSchema.parse(rawInput)
    const client = await ds.getClient(input.clientId)
    if (!client) throw new DomainError('errors.clientNotFound')
    if (client.archivedAt && !opts.id) throw new DomainError('errors.clientArchived')

    const record = buildInvoiceRecord(input)
    if (record.total <= 0 && opts.send) throw new DomainError('errors.totalMustBePositive')

    const saved = opts.id ? await ds.updateInvoice(opts.id, record) : await ds.createInvoice(record)
    const final = opts.send ? await ds.sendInvoice(saved.id) : saved
    revalidate()
    return { id: final.id, number: final.number }
  })
}

export async function sendInvoiceAction(id: string) {
  return runAction(async () => {
    const inv = await requireInvoice(id)
    if (inv.total <= 0) throw new DomainError('errors.totalMustBePositive')
    const sent = await getDataSource().sendInvoice(id)
    revalidate()
    return { number: sent.number }
  })
}

export async function deleteInvoiceAction(id: string) {
  return runAction(async () => {
    await getDataSource().deleteInvoice(id)
    revalidate()
  })
}

export async function cancelInvoiceAction(id: string) {
  return runAction(async () => {
    const inv = await requireInvoice(id)
    if (inv.amountPaid > 0) throw new DomainError('errors.cannotCancelPartiallyPaid')
    await getDataSource().cancelInvoice(id)
    revalidate()
  })
}

export async function duplicateInvoiceAction(id: string) {
  return runAction(async () => {
    const ds = getDataSource()
    const [inv, org] = await Promise.all([requireInvoice(id), ds.getOrganization()])
    if (!org) throw new DomainError('errors.noOrganization')
    const copy = await ds.createInvoice(duplicateRecord(inv, org))
    revalidate()
    return { id: copy.id }
  })
}

export async function recordPaymentAction(id: string, rawInput: unknown) {
  return runAction(async () => {
    const inv = await requireInvoice(id)
    if (!canRecordPayment(inv)) throw new DomainError('errors.notAwaitingPayment')
    const input = paymentInputSchema.parse(rawInput)
    const amount = toMinor(input.amount, inv.currency)
    const remaining = inv.total - inv.amountPaid
    if (amount > remaining) throw new DomainError('errors.paymentExceedsBalance')
    await getDataSource().addPayment(id, { ...input, amount })
    revalidate()
    return { fullyPaid: amount === remaining }
  })
}

/** Raccourci : enregistre le solde restant comme payé aujourd'hui. */
export async function markInvoicePaidAction(id: string) {
  return runAction(async () => {
    const inv = await requireInvoice(id)
    if (!canRecordPayment(inv)) throw new DomainError('errors.notAwaitingPayment')
    await getDataSource().addPayment(id, { amount: inv.total - inv.amountPaid, paidOn: todayISO(), method: 'bank' })
    revalidate()
  })
}
