import { ZodError } from 'zod'
import { DomainError } from '@/lib/data/types'

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }

/** Exécute une action et convertit les erreurs en résultat sérialisable pour le client. */
export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() }
  } catch (err) {
    if (err instanceof ZodError) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of err.issues) {
        const key = issue.path.join('.')
        if (!fieldErrors[key]) fieldErrors[key] = issue.message
      }
      return { ok: false, error: 'errors.invalidFields', fieldErrors }
    }
    if (err instanceof DomainError) return { ok: false, error: err.message }
    console.error('[action]', err)
    return { ok: false, error: 'errors.unexpected' }
  }
}
