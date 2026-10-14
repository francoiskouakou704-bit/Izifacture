import 'server-only'
import { isSupabaseEnabled } from '@/lib/supabase/config'
import type { DataSource } from './types'
import { mockDataSource } from './mock'
import { supabaseDataSource } from './supabase'

// Point d'entrée unique de la persistance : Supabase dès que l'environnement est configuré,
// données locales en mémoire sinon (ou avec DATA_SOURCE=mock, utilisé par les tests E2E).
export function getDataSource(): DataSource {
  return isSupabaseEnabled() ? supabaseDataSource : mockDataSource
}

export * from './types'
