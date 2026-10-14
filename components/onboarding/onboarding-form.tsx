'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Building2, Mail } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Controller, useForm } from 'react-hook-form'
import { completeOnboardingAction } from '@/actions/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAction } from '@/lib/hooks/use-action'
import { useErrorMessage } from '@/lib/i18n/client'
import { CURRENCIES, type Currency, type Organization } from '@/lib/types'
import { onboardingSchema, type OnboardingInput } from '@/lib/validations/organization'

// Noms de pays conservés tels que saisis sur les factures (pas traduits).
const COUNTRIES: { name: string; flag: string; currency: Currency }[] = [
  { name: 'Sénégal', flag: '🇸🇳', currency: 'XOF' },
  { name: "Côte d'Ivoire", flag: '🇨🇮', currency: 'XOF' },
  { name: 'Mali', flag: '🇲🇱', currency: 'XOF' },
  { name: 'Burkina Faso', flag: '🇧🇫', currency: 'XOF' },
  { name: 'Bénin', flag: '🇧🇯', currency: 'XOF' },
  { name: 'Togo', flag: '🇹🇬', currency: 'XOF' },
  { name: 'Niger', flag: '🇳🇪', currency: 'XOF' },
  { name: 'Cameroun', flag: '🇨🇲', currency: 'XAF' },
  { name: 'Gabon', flag: '🇬🇦', currency: 'XAF' },
  { name: 'Congo', flag: '🇨🇬', currency: 'XAF' },
  { name: 'RD Congo', flag: '🇨🇩', currency: 'CDF' },
  { name: 'Guinée', flag: '🇬🇳', currency: 'GNF' },
  { name: 'Nigeria', flag: '🇳🇬', currency: 'NGN' },
  { name: 'Ghana', flag: '🇬🇭', currency: 'GHS' },
  { name: 'Kenya', flag: '🇰🇪', currency: 'KES' },
  { name: 'Maroc', flag: '🇲🇦', currency: 'MAD' },
]

export function OnboardingForm({ org }: { org: Organization | null }) {
  const t = useTranslations('onboarding')
  const tCur = useTranslations('currencies')
  const e = useErrorMessage()
  const router = useRouter()
  const { pending, run } = useAction()
  const { register, control, handleSubmit, setValue, formState: { errors } } = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: org?.name ?? '',
      email: org?.email ?? '',
      country: org?.country ?? 'Sénégal',
      defaultCurrency: org?.defaultCurrency ?? 'XOF',
    },
  })

  const onSubmit = handleSubmit((data) =>
    run(() => completeOnboardingAction(data), {
      refresh: false,
      success: t('ready'),
      onSuccess: () => router.push('/dashboard'),
    })
  )

  return (
    <form onSubmit={onSubmit} noValidate className="card space-y-5 p-6">
      <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-950/40">
          <Building2 className="h-5 w-5 text-primary-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">{t('companyTitle')}</h2>
          <p className="text-xs text-[var(--text-muted)]">{t('companySubtitle')}</p>
        </div>
      </div>

      <Input
        label={t('name')}
        placeholder={t('namePlaceholder')}
        leftIcon={<Building2 className="h-4 w-4" />}
        error={e(errors.name?.message)}
        autoFocus
        {...register('name')}
      />
      <Input
        label={t('email')}
        type="email"
        placeholder="contact@monentreprise.com"
        leftIcon={<Mail className="h-4 w-4" />}
        error={e(errors.email?.message)}
        {...register('email')}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Controller
          control={control}
          name="country"
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={(v) => {
                field.onChange(v)
                const c = COUNTRIES.find((x) => x.name === v)
                if (c) setValue('defaultCurrency', c.currency)
              }}
            >
              <SelectTrigger label={t('country')}>
                <SelectValue placeholder={t('choose')}>{field.value}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.name} value={c.name}>
                    {c.flag} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <Controller
          control={control}
          name="defaultCurrency"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger label={t('currency')}>
                <SelectValue>{tCur(field.value)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.flag} {tCur(c.value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <Button type="submit" className="w-full" size="lg" loading={pending}>
        {t('submit')} <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  )
}
