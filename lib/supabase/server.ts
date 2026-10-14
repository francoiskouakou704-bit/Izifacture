import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cache } from 'react'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config'
import type { Database } from './database.types'

/**
 * Client Supabase lié à la session de l'utilisateur (cookies) : toutes les requêtes
 * passent par la RLS. Mémoïsé par requête.
 */
export const createSupabaseServerClient = cache(async () => {
  const cookieStore = await cookies()
  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(toSet) {
        try {
          for (const { name, value, options } of toSet) cookieStore.set(name, value, options)
        } catch {
          // Appelé depuis un Server Component : le middleware se charge du rafraîchissement.
        }
      },
    },
  })
})
