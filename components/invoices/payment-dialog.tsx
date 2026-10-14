'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarDays, Coins, Hash } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { recordPaymentAction } from '@/actions/invoices'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAction } from '@/lib/hooks/use-action'
import { useErrorMessage, useFormat } from '@/lib/i18n/client'
import { fromMinor } from '@/lib/money'
import { todayISO } from '@/lib/status'
import { PAYMENT_METHODS, type Invoice, type PaymentMethod } from '@/lib/types'
import { paymentInputSchema, type PaymentInput } from '@/lib/validations/invoice'

export function PaymentDialog({
  invoice,
  open,
  onOpenChange,
}: {
  invoice: Invoice
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useTranslations('payment')
  const tc = useTranslations('common')
  const tm = useTranslations('paymentMethods')
  const e = useErrorMessage()
  const fmt = useFormat()
  const { pending, run } = useAction()
  const remaining = invoice.total - invoice.amountPaid
  const remainingMajor = fromMinor(remaining, invoice.currency)

  const schema = paymentInputSchema.refine((v) => v.amount <= remainingMajor + 1e-9, {
    path: ['amount'],
    message: t('max', { amount: fmt.money(remaining, invoice.currency) }),
  })
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PaymentInput>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (open)
      reset({ amount: remainingMajor, paidOn: todayISO(), method: 'mobile_money', reference: '' })
  }, [open, remainingMajor, reset])

  const amount = watch('amount')
  const isFull = Number.isFinite(amount) && Math.abs(amount - remainingMajor) < 1e-9

  const onSubmit = handleSubmit((data) =>
    run(() => recordPaymentAction(invoice.id, data), {
      success: (r) =>
        r.fullyPaid ? t('fullyPaid') : t('partial'),
      onSuccess: () => onOpenChange(false),
    })
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={onSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>{t('title')}</DialogTitle>
            <DialogDescription>
              {t('remaining')}{' '}
              <strong className="text-[var(--text-primary)]">
                {fmt.money(remaining, invoice.currency)}
              </strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-6 py-5">
            <Input
              label={t('amount', { currency: invoice.currency })}
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              leftIcon={<Coins className="h-4 w-4" />}
              error={e(errors.amount?.message)}
              hint={
                isFull
                  ? t('fullHint')
                  : t('partialHint')
              }
              autoFocus
              {...register('amount', { valueAsNumber: true })}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label={t('date')}
                type="date"
                max={todayISO()}
                leftIcon={<CalendarDays className="h-4 w-4" />}
                error={e(errors.paidOn?.message)}
                {...register('paidOn')}
              />
              <Controller
                control={control}
                name="method"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => field.onChange(v as PaymentMethod)}
                  >
                    <SelectTrigger label={t('method')}>
                      <SelectValue>{tm(field.value)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {tm(m)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <Input
              label={t('reference')}
              placeholder={t('referencePlaceholder')}
              leftIcon={<Hash className="h-4 w-4" />}
              error={e(errors.reference?.message)}
              {...register('reference')}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tc('cancel')}
            </Button>
            <Button type="submit" variant="success" loading={pending}>
              {t('submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
