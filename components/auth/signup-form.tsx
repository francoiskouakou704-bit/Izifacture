'use client'

import { MailCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { signUpAction } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormAlert } from './form-alert'
import { useAuthForm } from './use-auth-form'

/** `onBackToLogin` : retour à l'onglet Connexion de la même carte (sinon lien vers /login). */
export function SignupForm({ onBackToLogin }: { onBackToLogin?: () => void }) {
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
        {onBackToLogin ? (
          <button type="button" onClick={onBackToLogin} className="inline-block text-sm font-medium text-primary-600 hover:text-primary-700">
            {t('backToLogin')}
          </button>
        ) : (
          <Link href="/login" className="inline-block text-sm font-medium text-primary-600 hover:text-primary-700">
            {t('backToLogin')}
          </Link>
        )}
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
        {...field('fullName')}
      />
      <Input
        label={t('email')}
        type="email"
        autoComplete="email"
        placeholder={t('emailPlaceholder')}
        {...field('email')}
      />
      <Input
        label={t('password')}
        type="password"
        autoComplete="new-password"
        placeholder={t('passwordPlaceholder')}
        hint={t('passwordHint')}
        {...field('password')}
      />
      <Button type="submit" className="w-full bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-950 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100" size="lg" loading={pending}>
        {t('createMyAccount')}
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
