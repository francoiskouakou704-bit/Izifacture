import { z } from 'zod'
import { CURRENCIES, type Currency } from '@/lib/types'

// Les messages sont des clés de traduction (messages/*.json), traduites à l'affichage.

const currencyValues = CURRENCIES.map((c) => c.value) as [Currency, ...Currency[]]
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'validation.invalidDate')

const num = () => z.number({ error: 'validation.invalidNumber' }).refine(Number.isFinite, 'validation.invalidNumber')

// Montants saisis en unités MAJEURES (ex. 2 500,50 $) ; conversion en unités mineures côté serveur.
export const invoiceItemSchema = z.object({
  description: z.string().trim().min(1, 'validation.descriptionRequired').max(500, 'validation.tooLong'),
  quantity: num().gt(0, 'validation.mustBePositive').max(1_000_000, 'validation.tooHigh'),
  unitPrice: num().min(0, 'validation.noNegative').max(1_000_000_000_000, 'validation.tooHigh'),
  taxRate: num().min(0, 'validation.noNegative').max(100, 'validation.max100'),
})

export const invoiceInputSchema = z
  .object({
    clientId: z.string().min(1, 'validation.clientRequired'),
    issueDate: isoDate,
    dueDate: isoDate,
    currency: z.enum(currencyValues),
    discountType: z.enum(['none', 'percent', 'fixed']),
    discountValue: num().min(0, 'validation.noNegative'),
    notes: z.string().max(2000, 'validation.tooLong').optional(),
    terms: z.string().max(2000, 'validation.tooLong').optional(),
    items: z.array(invoiceItemSchema).min(1, 'validation.itemsMin').max(100, 'validation.itemsMax'),
  })
  .refine((v) => v.dueDate >= v.issueDate, {
    path: ['dueDate'],
    message: 'validation.dueBeforeIssue',
  })
  .refine((v) => v.discountType !== 'percent' || v.discountValue <= 100, {
    path: ['discountValue'],
    message: 'validation.max100',
  })

export type InvoiceInput = z.infer<typeof invoiceInputSchema>
export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>

export const paymentInputSchema = z.object({
  amount: num().gt(0, 'validation.mustBePositive'),
  paidOn: isoDate,
  method: z.enum(['bank', 'mobile_money', 'cash', 'card', 'other']),
  reference: z.string().trim().max(200, 'validation.tooLong').optional(),
})

export type PaymentInput = z.infer<typeof paymentInputSchema>
