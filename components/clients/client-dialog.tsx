'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, Globe, Hash, Mail, MapPin, Phone } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { createClientAction, updateClientAction } from '@/actions/clients'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAction } from '@/lib/hooks/use-action'
import { useErrorMessage } from '@/lib/i18n/client'
import type { Client } from '@/lib/types'
import { clientInputSchema, type ClientData, type ClientInput } from '@/lib/validations/client'

interface ClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client?: Client | null
  onSaved?: (client: Client) => void
}

const empty: ClientInput = { name: '', email: '', phone: '', address: '', city: '', country: '', taxId: '', notes: '' }

export function ClientDialog({ open, onOpenChange, client, onSaved }: ClientDialogProps) {
  const t = useTranslations('clients.dialog')
  const tc = useTranslations('common')
  const e = useErrorMessage()
  const { pending, run } = useAction()
  const form = useForm<ClientInput, unknown, ClientData>({
    resolver: zodResolver(clientInputSchema),
    defaultValues: empty,
  })
  const { register, handleSubmit, reset, setError, formState: { errors } } = form

  useEffect(() => {
    if (open) {
      reset(
        client
          ? {
              name: client.name,
              email: client.email ?? '',
              phone: client.phone ?? '',
              address: client.address ?? '',
              city: client.city ?? '',
              country: client.country ?? '',
              taxId: client.taxId ?? '',
              notes: client.notes ?? '',
            }
          : empty
      )
    }
  }, [open, client, reset])

  const onSubmit = handleSubmit((data) => {
    run(() => (client ? updateClientAction(client.id, data) : createClientAction(data)), {
      success: client ? t('updated') : t('created'),
      onSuccess: (saved) => {
        onSaved?.(saved)
        onOpenChange(false)
      },
      onError: (r) => {
        for (const [field, message] of Object.entries(r.fieldErrors ?? {})) {
          setError(field as keyof ClientInput, { message })
        }
      },
    })
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <form onSubmit={onSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>{client ? t('editTitle') : t('createTitle')}</DialogTitle>
            <DialogDescription>{t('description')}</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-4 overflow-y-auto px-6 py-5">
            <Input
              label={t('name')}
              placeholder={t('namePlaceholder')}
              leftIcon={<Building2 className="h-4 w-4" />}
              error={e(errors.name?.message)}
              autoFocus
              {...register('name')}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label={t('email')} type="email" placeholder="contact@client.com" leftIcon={<Mail className="h-4 w-4" />} error={e(errors.email?.message)} {...register('email')} />
              <Input label={t('phone')} placeholder="+221 77 000 00 00" leftIcon={<Phone className="h-4 w-4" />} error={e(errors.phone?.message)} {...register('phone')} />
            </div>
            <Input label={t('address')} placeholder={t('addressPlaceholder')} leftIcon={<MapPin className="h-4 w-4" />} error={e(errors.address?.message)} {...register('address')} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input label={t('city')} placeholder="Abidjan" error={e(errors.city?.message)} {...register('city')} />
              <Input label={t('country')} placeholder="Côte d'Ivoire" leftIcon={<Globe className="h-4 w-4" />} error={e(errors.country?.message)} {...register('country')} />
              <Input label={t('taxId')} placeholder={t('taxIdPlaceholder')} leftIcon={<Hash className="h-4 w-4" />} error={e(errors.taxId?.message)} {...register('taxId')} />
            </div>
            <Textarea label={t('notes')} placeholder={t('notesPlaceholder')} rows={2} error={e(errors.notes?.message)} {...register('notes')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tc('cancel')}
            </Button>
            <Button type="submit" loading={pending}>
              {client ? tc('save') : t('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
