'use server'

import { revalidatePath } from 'next/cache'
import { DomainError, getDataSource } from '@/lib/data'
import {
  LOGO_MAX_BYTES,
  LOGO_MIME_TYPES,
  companyInputSchema,
  invoicingDefaultsSchema,
  onboardingSchema,
} from '@/lib/validations/organization'
import { runAction } from './utils'

export async function updateCompanyAction(rawInput: unknown) {
  return runAction(async () => {
    const data = companyInputSchema.parse(rawInput)
    // Clés explicites : un champ vidé doit être effacé, pas ignoré
    await getDataSource().updateOrganization({
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      country: data.country,
      taxId: data.taxId,
    })
    revalidatePath('/', 'layout')
  })
}

export async function updateInvoicingDefaultsAction(rawInput: unknown) {
  return runAction(async () => {
    const data = invoicingDefaultsSchema.parse(rawInput)
    await getDataSource().updateOrganization({
      defaultCurrency: data.defaultCurrency,
      defaultTaxRate: data.defaultTaxRate,
      invoicePrefix: data.invoicePrefix.toUpperCase(),
      paymentTermsDays: data.paymentTermsDays,
      paymentInstructions: data.paymentInstructions,
      footerNote: data.footerNote,
    })
    revalidatePath('/', 'layout')
  })
}

/** Reçoit le logo en data URL (lu côté navigateur), le valide puis le confie à la couche de données. */
export async function updateLogoAction(dataUrl: string | null) {
  return runAction(async () => {
    let file: { mimeType: string; bytes: Uint8Array } | null = null
    if (dataUrl !== null) {
      const match = /^data:([a-z+/]+);base64,(.+)$/.exec(dataUrl)
      if (!match || !LOGO_MIME_TYPES.includes(match[1])) throw new DomainError('errors.logoFormat')
      const bytes = new Uint8Array(Buffer.from(match[2], 'base64'))
      if (bytes.byteLength > LOGO_MAX_BYTES) throw new DomainError('errors.logoTooLarge')
      file = { mimeType: match[1], bytes }
    }
    await getDataSource().setLogo(file)
    revalidatePath('/', 'layout')
  })
}

export async function completeOnboardingAction(rawInput: unknown) {
  return runAction(async () => {
    const data = onboardingSchema.parse(rawInput)
    const ds = getDataSource()
    const existing = await ds.getOrganization()
    if (existing) await ds.updateOrganization(data)
    else await ds.createOrganization(data)
    revalidatePath('/', 'layout')
  })
}
