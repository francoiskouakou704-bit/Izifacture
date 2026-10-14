import { z } from 'zod'
import { CURRENCIES, type Currency } from '@/lib/types'
import { optionalEmail, optionalText } from './client'

const currencyValues = CURRENCIES.map((c) => c.value) as [Currency, ...Currency[]]

export const companyInputSchema = z.object({
  name: z.string().trim().min(2, 'validation.companyNameRequired').max(200, 'validation.tooLong'),
  email: optionalEmail,
  phone: optionalText(40),
  address: optionalText(300),
  city: optionalText(100),
  country: optionalText(100),
  taxId: optionalText(100),
})

export const invoicingDefaultsSchema = z.object({
  defaultCurrency: z.enum(currencyValues),
  defaultTaxRate: z.number({ error: 'validation.invalidNumber' }).min(0, 'validation.noNegative').max(100, 'validation.max100'),
  invoicePrefix: z
    .string()
    .trim()
    .min(1, 'validation.prefixRequired')
    .max(10, 'validation.prefixTooLong')
    .regex(/^[A-Za-z0-9-]+$/, 'validation.prefixFormat'),
  paymentTermsDays: z
    .number({ error: 'validation.invalidNumber' })
    .int('validation.integer')
    .min(0, 'validation.noNegative')
    .max(365, 'validation.tooHigh'),
  paymentInstructions: optionalText(1000),
  footerNote: optionalText(500),
})

export const onboardingSchema = companyInputSchema.pick({ name: true, email: true, country: true }).extend({
  defaultCurrency: z.enum(currencyValues),
})

// Logo : data URL (mode local) ou URL Storage (Supabase). Max 2 Mo.
export const LOGO_MAX_BYTES = 2 * 1024 * 1024
export const LOGO_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']

export type CompanyInput = z.input<typeof companyInputSchema>
export type CompanyData = z.output<typeof companyInputSchema>
export type InvoicingDefaultsInput = z.input<typeof invoicingDefaultsSchema>
export type InvoicingDefaultsData = z.output<typeof invoicingDefaultsSchema>
export type OnboardingInput = z.input<typeof onboardingSchema>
