'use server'

import { revalidatePath } from 'next/cache'
import { getDataSource } from '@/lib/data'
import { clientInputSchema } from '@/lib/validations/client'
import { runAction } from './utils'

export async function createClientAction(rawInput: unknown) {
  return runAction(async () => {
    const client = await getDataSource().createClient(clientInputSchema.parse(rawInput))
    revalidatePath('/', 'layout')
    return client
  })
}

export async function updateClientAction(id: string, rawInput: unknown) {
  return runAction(async () => {
    const client = await getDataSource().updateClient(id, clientInputSchema.parse(rawInput))
    revalidatePath('/', 'layout')
    return client
  })
}

export async function setClientArchivedAction(id: string, archived: boolean) {
  return runAction(async () => {
    await getDataSource().setClientArchived(id, archived)
    revalidatePath('/', 'layout')
  })
}
