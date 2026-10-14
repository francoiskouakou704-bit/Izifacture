'use client'

import { ArrowRight, Lock, Mail } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signInAction } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormAlert } from './form-alert'
import { useAuthForm } from './use-auth-form'

export function LoginForm({ next, linkError }: { next?: string; linkError?: boolean }) {
  const t = useTranslations('auth')
  const router = useRouter()
  const { field, submit, pending, formError } = useAuthForm({ email: '', password: '' })

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={submit(
        (v) => signInAction(v, next),
        ({ redirectTo }) => {
          router.replace(redirectTo)
          router.refresh()
        }
      )}
    >
      {linkError && !formError && <FormAlert>{t('linkInvalid')}</FormAlert>}
      {formError && <FormAlert>{formError}</FormAlert>}
      <Input
        label={t('email')}
        type="email"
        autoComplete="email"
        placeholder={t('emailPlaceholder')}
        leftIcon={<Mail className="h-4 w-4" />}
        {...field('email')}
      />
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label htmlFor="login-password" className="label mb-0">
            {t('password')}
          </label>
          <Link href="/forgot-password" className="text-xs text-primary-600 hover:text-primary-700">
            {t('forgot')}
          </Link>
        </div>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          leftIcon={<Lock className="h-4 w-4" />}
          {...field('password')}
        />
      </div>
      <Button type="submit" className="w-full" size="lg" loading={pending}>
        {t('login')}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  )
}
