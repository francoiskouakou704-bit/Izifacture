'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, CreditCard, Globe, Hash, Mail, MapPin, Phone, Trash2, Upload, User } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { updateCompanyAction, updateInvoicingDefaultsAction, updateLogoAction } from '@/actions/settings'
import { LocaleSwitcher } from '@/components/layout/locale-switcher'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsListUnderline, TabsTriggerUnderline } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useAction } from '@/lib/hooks/use-action'
import { useErrorMessage } from '@/lib/i18n/client'
import { CURRENCIES, type CurrentUser, type Organization } from '@/lib/types'
import {
  LOGO_MAX_BYTES,
  LOGO_MIME_TYPES,
  companyInputSchema,
  invoicingDefaultsSchema,
  type CompanyData,
  type CompanyInput,
  type InvoicingDefaultsData,
  type InvoicingDefaultsInput,
} from '@/lib/validations/organization'

function LogoCard({ org }: { org: Organization }) {
  const t = useTranslations('settings.logo')
  const te = useTranslations('errors')
  const inputRef = useRef<HTMLInputElement>(null)
  const { pending, run } = useAction()

  function onFile(file: File | undefined) {
    if (!file) return
    if (!LOGO_MIME_TYPES.includes(file.type)) return toast.error(te('logoFormat'))
    if (file.size > LOGO_MAX_BYTES) return toast.error(te('logoTooLarge'))
    const reader = new FileReader()
    reader.onload = () => run(() => updateLogoAction(reader.result as string), { success: t('updated') })
    reader.readAsDataURL(file)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="group flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-[var(--border)] bg-gray-50 transition-all hover:border-primary-400 dark:bg-dark-elevated"
          aria-label={t('choose')}
        >
          {org.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={org.logoUrl} alt={t('current')} className="h-full w-full object-contain p-2" />
          ) : (
            <span className="flex flex-col items-center text-[var(--text-muted)] group-hover:text-primary-600">
              <Upload className="mb-1 h-6 w-6" />
              <span className="text-xs">{t('title')}</span>
            </span>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={LOGO_MIME_TYPES.join(',')}
          className="hidden"
          onChange={(e) => {
            onFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} loading={pending}>
            {org.logoUrl ? t('change') : t('upload')}
          </Button>
          {org.logoUrl && (
            <Button
              variant="ghost"
              size="sm"
              aria-label={t('remove')}
              onClick={() => run(() => updateLogoAction(null), { success: t('removed') })}
              disabled={pending}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <p className="text-center text-xs text-[var(--text-muted)]">{t('hint')}</p>
      </CardContent>
    </Card>
  )
}

function CompanyForm({ org }: { org: Organization }) {
  const t = useTranslations('settings.company')
  const tc = useTranslations('common')
  const e = useErrorMessage()
  const { pending, run } = useAction()
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<CompanyInput, unknown, CompanyData>({
    resolver: zodResolver(companyInputSchema),
    defaultValues: {
      name: org.name,
      email: org.email ?? '',
      phone: org.phone ?? '',
      address: org.address ?? '',
      city: org.city ?? '',
      country: org.country ?? '',
      taxId: org.taxId ?? '',
    },
  })

  const onSubmit = handleSubmit((data) =>
    run(() => updateCompanyAction(data), { success: t('saved'), onSuccess: () => reset(undefined, { keepValues: true }) })
  )

  return (
    <Card className="xl:col-span-2">
      <form onSubmit={onSubmit} noValidate>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input label={t('name')} leftIcon={<Building2 className="h-4 w-4" />} error={e(errors.name?.message)} {...register('name')} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label={t('email')} type="email" placeholder="contact@entreprise.com" leftIcon={<Mail className="h-4 w-4" />} error={e(errors.email?.message)} {...register('email')} />
            <Input label={t('phone')} placeholder="+221 77 000 00 00" leftIcon={<Phone className="h-4 w-4" />} error={e(errors.phone?.message)} {...register('phone')} />
          </div>
          <Input label={t('address')} placeholder={t('addressPlaceholder')} leftIcon={<MapPin className="h-4 w-4" />} error={e(errors.address?.message)} {...register('address')} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input label={t('city')} placeholder="Dakar" error={e(errors.city?.message)} {...register('city')} />
            <Input label={t('country')} placeholder="Sénégal" leftIcon={<Globe className="h-4 w-4" />} error={e(errors.country?.message)} {...register('country')} />
            <Input label={t('taxId')} placeholder={t('taxIdPlaceholder')} leftIcon={<Hash className="h-4 w-4" />} error={e(errors.taxId?.message)} {...register('taxId')} />
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" loading={pending} disabled={!isDirty}>
            {tc('save')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

function InvoicingForm({ org }: { org: Organization }) {
  const t = useTranslations('settings.invoicing')
  const tc = useTranslations('common')
  const tCur = useTranslations('currencies')
  const e = useErrorMessage()
  const { pending, run } = useAction()
  const { register, control, handleSubmit, reset, formState: { errors, isDirty } } = useForm<
    InvoicingDefaultsInput,
    unknown,
    InvoicingDefaultsData
  >({
    resolver: zodResolver(invoicingDefaultsSchema),
    defaultValues: {
      defaultCurrency: org.defaultCurrency,
      defaultTaxRate: org.defaultTaxRate,
      invoicePrefix: org.invoicePrefix,
      paymentTermsDays: org.paymentTermsDays,
      paymentInstructions: org.paymentInstructions ?? '',
      footerNote: org.footerNote ?? '',
    },
  })

  const onSubmit = handleSubmit((data) =>
    run(() => updateInvoicingDefaultsAction(data), { success: t('saved'), onSuccess: () => reset(undefined, { keepValues: true }) })
  )
  const nextNumber = `${org.invoicePrefix}-${new Date().getFullYear()}-${String(org.nextInvoiceNumber).padStart(4, '0')}`

  return (
    <Card>
      <form onSubmit={onSubmit} noValidate>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
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
            <Input label={t('taxRate')} type="number" step="any" min="0" max="100" error={e(errors.defaultTaxRate?.message)} {...register('defaultTaxRate', { valueAsNumber: true })} />
            <Input
              label={t('prefix')}
              placeholder="INV"
              error={e(errors.invoicePrefix?.message)}
              hint={t('nextNumber', { number: nextNumber })}
              {...register('invoicePrefix')}
            />
            <Input label={t('terms')} type="number" min="0" max="365" error={e(errors.paymentTermsDays?.message)} {...register('paymentTermsDays', { valueAsNumber: true })} />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Textarea
              label={t('paymentInstructions')}
              placeholder={t('paymentInstructionsPlaceholder')}
              rows={4}
              error={e(errors.paymentInstructions?.message)}
              hint={t('paymentInstructionsHint')}
              {...register('paymentInstructions')}
            />
            <Textarea label={t('footer')} placeholder={t('footerPlaceholder')} rows={4} error={e(errors.footerNote?.message)} {...register('footerNote')} />
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" loading={pending} disabled={!isDirty}>
            {tc('save')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

function AccountTab({ user }: { user: CurrentUser }) {
  const t = useTranslations('settings.account')
  return (
    <div className="grid max-w-3xl grid-cols-1 gap-5">
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label={t('fullName')} value={user.fullName} readOnly leftIcon={<User className="h-4 w-4" />} className="bg-gray-50 dark:bg-dark-elevated" />
          <Input label={t('email')} value={user.email} readOnly leftIcon={<Mail className="h-4 w-4" />} className="bg-gray-50 dark:bg-dark-elevated" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t('preferences')}</CardTitle>
          <CardDescription>{t('preferencesDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="label">{t('language')}</p>
          <LocaleSwitcher variant="inline" />
        </CardContent>
      </Card>
    </div>
  )
}

export function SettingsView({ org, user }: { org: Organization; user: CurrentUser }) {
  const t = useTranslations('settings')
  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="page-title">{t('title')}</h1>
        <p className="page-subtitle">{t('subtitle')}</p>
      </div>

      <Tabs defaultValue="company">
        <TabsListUnderline className="no-scrollbar w-full overflow-x-auto">
          <TabsTriggerUnderline value="company">
            <Building2 className="h-4 w-4" /> {t('tabs.company')}
          </TabsTriggerUnderline>
          <TabsTriggerUnderline value="invoicing">
            <CreditCard className="h-4 w-4" /> {t('tabs.invoicing')}
          </TabsTriggerUnderline>
          <TabsTriggerUnderline value="account">
            <User className="h-4 w-4" /> {t('tabs.account')}
          </TabsTriggerUnderline>
        </TabsListUnderline>

        <TabsContent value="company" className="mt-6">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <LogoCard org={org} />
            <CompanyForm org={org} />
          </div>
        </TabsContent>

        <TabsContent value="invoicing" className="mt-6">
          <InvoicingForm org={org} />
        </TabsContent>

        <TabsContent value="account" className="mt-6">
          <AccountTab user={user} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
