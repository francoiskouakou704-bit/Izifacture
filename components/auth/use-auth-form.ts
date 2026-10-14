'use client'

import { useState, useTransition } from 'react'
import type { ActionResult } from '@/actions/utils'
import { useErrorMessage } from '@/lib/i18n/client'

/** État d'un formulaire d'authentification : valeurs, erreurs par champ, erreur globale. */
export function useAuthForm<F extends string>(initial: Record<F, string>) {
  const [values, setValues] = useState(initial)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<F, string>>>({})
  const [formError, setFormError] = useState<string>()
  const [pending, startTransition] = useTransition()
  const e = useErrorMessage()

  const field = (name: F) => ({
    name,
    value: values[name],
    onChange: (ev: React.ChangeEvent<HTMLInputElement>) => setValues((v) => ({ ...v, [name]: ev.target.value })),
    error: e(fieldErrors[name]),
  })

  function submit<T>(action: (v: Record<F, string>) => Promise<ActionResult<T>>, onSuccess: (data: T) => void) {
    return (ev: React.FormEvent) => {
      ev.preventDefault()
      startTransition(async () => {
        const result = await action(values)
        if (result.ok) {
          setFieldErrors({})
          setFormError(undefined)
          onSuccess(result.data)
          return
        }
        setFieldErrors((result.fieldErrors ?? {}) as Partial<Record<F, string>>)
        setFormError(result.fieldErrors ? undefined : e(result.error))
      })
    }
  }

  return { values, field, submit, pending, formError }
}
