'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'
import type { ActionResult } from '@/actions/utils'
import { useErrorMessage } from '@/lib/i18n/client'

/** Exécute une Server Action avec état de chargement, toast de résultat et rafraîchissement. */
export function useAction() {
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const errorText = useErrorMessage()

  function run<T>(
    action: () => Promise<ActionResult<T>>,
    opts: {
      success?: string | ((data: T) => string)
      onSuccess?: (data: T) => void
      onError?: (result: Extract<ActionResult<T>, { ok: false }>) => void
      refresh?: boolean
    } = {}
  ) {
    startTransition(async () => {
      const result = await action()
      if (!result.ok) {
        toast.error(errorText(result.error))
        opts.onError?.(result)
        return
      }
      if (opts.success) toast.success(typeof opts.success === 'function' ? opts.success(result.data) : opts.success)
      opts.onSuccess?.(result.data)
      if (opts.refresh !== false) router.refresh()
    })
  }

  return { pending, run }
}
