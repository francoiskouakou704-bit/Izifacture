import { z } from 'zod'

export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, 'validation.tooLong')
    .optional()
    .transform((v) => (v ? v : undefined))

export const optionalEmail = z
  .union([z.literal(''), z.string().trim().email('validation.invalidEmail')])
  .optional()
  .transform((v) => (v ? v : undefined))

export const clientInputSchema = z.object({
  name: z.string().trim().min(2, 'validation.nameMin').max(200, 'validation.tooLong'),
  email: optionalEmail,
  phone: optionalText(40),
  address: optionalText(300),
  city: optionalText(100),
  country: optionalText(100),
  taxId: optionalText(100),
  notes: optionalText(2000),
})

export type ClientInput = z.input<typeof clientInputSchema>
export type ClientData = z.output<typeof clientInputSchema>
