import { z } from './zod'
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
// Pas de SVG : un SVG peut contenir du JavaScript, exécuté si le fichier hébergé est ouvert directement.
export const LOGO_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp']

/** Le contenu correspond-il vraiment au type annoncé ? (signature des premiers octets) */
export function hasImageSignature(bytes: Uint8Array, mimeType: string): boolean {
  const starts = (sig: number[], offset = 0) => sig.every((b, i) => bytes[offset + i] === b)
  switch (mimeType) {
    case 'image/png':
      return starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    case 'image/jpeg':
      return starts([0xff, 0xd8, 0xff])
    case 'image/webp':
      return starts([0x52, 0x49, 0x46, 0x46]) && starts([0x57, 0x45, 0x42, 0x50], 8) // « RIFF….WEBP »
    default:
      return false
  }
}

export type CompanyInput = z.input<typeof companyInputSchema>
export type CompanyData = z.output<typeof companyInputSchema>
export type InvoicingDefaultsInput = z.input<typeof invoicingDefaultsSchema>
export type InvoicingDefaultsData = z.output<typeof invoicingDefaultsSchema>
export type OnboardingInput = z.input<typeof onboardingSchema>
