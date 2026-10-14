import 'server-only'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { getDataSource } from '@/lib/data'

// Accès à la session et à l'organisation courantes, mémoïsés par requête.
// Phase 4 : getCurrentUser() s'appuiera sur Supabase Auth.

export const getCurrentUser = cache(() => getDataSource().getCurrentUser())
export const getOrganization = cache(() => getDataSource().getOrganization())

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}

/** Garantit qu'une entreprise est configurée, sinon envoie vers l'onboarding. */
export async function requireOrganization() {
  const org = await getOrganization()
  if (!org) redirect('/onboarding')
  return org
}
