'use client'

import { Lock, Mail } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { requestPasswordResetAction, updatePasswordAction } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormAlert } from './form-alert'
import { useAuthForm } from './use-auth-form'

export function ForgotPasswordForm() {
  const t = useTranslations('auth')
  const [sentTo, setSentTo] = useState<string>()
  const { values, field, submit, pending, formError } = useAuthForm({ email: '' })

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={submit(requestPasswordResetAction, () => setSentTo(values.email.trim()))}
    >
      {formError && <FormAlert>{formError}</FormAlert>}
      {sentTo && <FormAlert tone="success">{t('resetSent', { email: sentTo })}</FormAlert>}
      <Input
        label={t('email')}
        type="email"
        autoComplete="email"
        placeholder={t('emailPlaceholder')}
        leftIcon={<Mail className="h-4 w-4" />}
        {...field('email')}
      />
      <Button type="submit" className="w-full" size="lg" loading={pending}>
        {t('sendResetLink')}
      </Button>
    </form>
  )
}

export function ResetPasswordForm() {
  const t = useTranslations('auth')
  const router = useRouter()
  const { field, submit, pending, formError } = useAuthForm({ password: '' })

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={submit(updatePasswordAction, () => {
        toast.success(t('passwordUpdated'))
        router.replace('/dashboard')
        router.refresh()
      })}
    >
      {formError && <FormAlert>{formError}</FormAlert>}
      <Input
        label={t('newPassword')}
        type="password"
        autoComplete="new-password"
        placeholder={t('passwordPlaceholder')}
        leftIcon={<Lock className="h-4 w-4" />}
        hint={t('passwordHint')}
        {...field('password')}
      />
      <Button type="submit" className="w-full" size="lg" loading={pending}>
        {t('updatePassword')}
      </Button>
    </form>
  )
}
