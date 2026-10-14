'use client'

import { ArrowRight, Lock, Mail, MailCheck, User } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { signUpAction } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormAlert } from './form-alert'
import { useAuthForm } from './use-auth-form'

export function SignupForm() {
  const t = useTranslations('auth')
  const router = useRouter()
  const [sentTo, setSentTo] = useState<string>()
  const { values, field, submit, pending, formError } = useAuthForm({ fullName: '', email: '', password: '' })

  if (sentTo) {
    return (
      <div className="space-y-3 text-center" role="status">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-600/15">
          <MailCheck className="h-6 w-6" />
        </div>
        <h2 className="text-base font-semibold text-[var(--text-primary)]">{t('checkEmailTitle')}</h2>
        <p className="text-sm text-[var(--text-muted)]">{t('checkEmailText', { email: sentTo })}</p>
        <Link href="/login" className="inline-block text-sm font-medium text-primary-600 hover:text-primary-700">
          {t('backToLogin')}
        </Link>
      </div>
    )
  }

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={submit(signUpAction, ({ needsConfirmation }) => {
        if (needsConfirmation) setSentTo(values.email.trim())
        else {
          router.replace('/onboarding')
          router.refresh()
        }
      })}
    >
      {formError && <FormAlert>{formError}</FormAlert>}
      <Input
        label={t('fullName')}
        autoComplete="name"
        placeholder="Amadou Diallo"
        leftIcon={<User className="h-4 w-4" />}
        {...field('fullName')}
      />
      <Input
        label={t('email')}
        type="email"
        autoComplete="email"
        placeholder={t('emailPlaceholder')}
        leftIcon={<Mail className="h-4 w-4" />}
        {...field('email')}
      />
      <Input
        label={t('password')}
        type="password"
        autoComplete="new-password"
        placeholder={t('passwordPlaceholder')}
        leftIcon={<Lock className="h-4 w-4" />}
        hint={t('passwordHint')}
        {...field('password')}
      />
      <Button type="submit" className="w-full" size="lg" loading={pending}>
        {t('createMyAccount')}
        <ArrowRight className="h-4 w-4" />
      </Button>
      <p className="text-center text-xs text-[var(--text-muted)]">
        {t('termsPrefix')}{' '}
        <Link href="#" className="text-primary-600 underline">
          {t('terms')}
        </Link>{' '}
        {t('and')}{' '}
        <Link href="#" className="text-primary-600 underline">
          {t('privacy')}
        </Link>
        .
      </p>
    </form>
  )
}
