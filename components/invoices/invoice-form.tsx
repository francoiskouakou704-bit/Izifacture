'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Coins,
  FileText,
  Hash,
  Layers,
  Mail,
  Package,
  Percent,
  Plus,
  Send,
  Trash2,
  UserPlus,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useFieldArray, useForm, useWatch, type FieldErrors } from 'react-hook-form'
import { toast } from 'sonner'
import { saveInvoiceAction } from '@/actions/invoices'
import { ClientDialog } from '@/components/clients/client-dialog'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { addDays } from '@/lib/dates'
import { useAction } from '@/lib/hooks/use-action'
import { taxBreakdown } from '@/lib/invoice-math'
import { orgToSnapshot, type InvoiceDocumentData } from '@/lib/invoice-document'
import { useErrorMessage, useFormat } from '@/lib/i18n/client'
import { fromMinor } from '@/lib/money'
import { buildInvoiceRecord } from '@/lib/services/invoices'
import { todayISO } from '@/lib/status'
import { CURRENCIES, type Client, type Invoice, type Organization } from '@/lib/types'
import { cn } from '@/lib/utils'
import { invoiceInputSchema, type InvoiceInput } from '@/lib/validations/invoice'
import { InvoiceDocument } from './invoice-document'
import { InvoiceEmailPreview } from './invoice-email-preview'
import { ClientAvatar, CurrencyBadge } from './visuals'

interface InvoiceFormProps {
  organization: Organization
  clients: Client[]
  /** Brouillon existant à modifier. */
  invoice?: Invoice
  /** Client présélectionné (ex. depuis la fiche client). */
  defaultClientId?: string
}

const TAX_RATES = [0, 5, 10, 18, 20]

function initialValues(org: Organization, invoice?: Invoice, clientId?: string): InvoiceInput {
  if (invoice) {
    const c = invoice.currency
    return {
      clientId: invoice.clientId,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      currency: c,
      discountType: invoice.discountType ?? 'none',
      discountValue:
        invoice.discountType === 'fixed'
          ? fromMinor(invoice.discountValue, c)
          : invoice.discountValue,
      notes: invoice.notes ?? '',
      terms: invoice.terms ?? '',
      items: invoice.items.map((it) => ({
        description: it.description,
        quantity: it.quantity,
        unitPrice: fromMinor(it.unitPrice, c),
        taxRate: it.taxRate,
      })),
    }
  }
  const today = todayISO()
  return {
    clientId: clientId ?? '',
    issueDate: today,
    dueDate: addDays(today, org.paymentTermsDays),
    currency: org.defaultCurrency,
    discountType: 'none',
    discountValue: 0,
    notes: '',
    terms: '',
    items: [{ description: '', quantity: 1, unitPrice: 0, taxRate: org.defaultTaxRate }],
  }
}

const finite = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) ? n : 0)

/** Construit l'aperçu à partir d'une saisie potentiellement incomplète. */
function previewData(
  values: InvoiceInput,
  org: Organization,
  clients: Client[]
): InvoiceDocumentData {
  const record = buildInvoiceRecord({
    ...values,
    discountValue: finite(values.discountValue),
    items: (values.items ?? []).map((i) => ({
      description: i?.description ?? '',
      quantity: finite(i?.quantity),
      unitPrice: finite(i?.unitPrice),
      taxRate: finite(i?.taxRate),
    })),
  })
  const client = clients.find((c) => c.id === values.clientId)
  return {
    number: null,
    issueDate: values.issueDate || todayISO(),
    dueDate: values.dueDate || values.issueDate || todayISO(),
    currency: values.currency,
    company: orgToSnapshot(org),
    client: client ?? null,
    items: record.items,
    subtotal: record.subtotal,
    discountType: record.discountType,
    discountValue: record.discountValue,
    discountTotal: record.discountTotal,
    taxes: taxBreakdown(record.items, { ...record, lines: record.items }),
    total: record.total,
    amountPaid: 0,
    notes: record.notes,
    paymentInstructions: org.paymentInstructions,
    footerNote: org.footerNote,
  }
}

/** Premier message d'erreur à afficher en toast (clé de traduction). */
function firstError(errors: FieldErrors<InvoiceInput>): string | undefined {
  if (errors.clientId) return errors.clientId.message
  if (errors.items?.root?.message || errors.items?.message)
    return errors.items.root?.message ?? errors.items.message
  if (Array.isArray(errors.items) && errors.items.some(Boolean))
    return 'invoiceForm.checkItems'
  return Object.values(errors).find((e) => e && 'message' in e)?.message as string | undefined
}

export function InvoiceForm({
  organization: org,
  clients: initialClients,
  invoice,
  defaultClientId,
}: InvoiceFormProps) {
  const t = useTranslations('invoiceForm')
  const tCur = useTranslations('currencies')
  const e = useErrorMessage()
  const fmt = useFormat()
  const router = useRouter()
  const { pending, run } = useAction()
  const [clients, setClients] = useState(initialClients)
  const [clientDialogOpen, setClientDialogOpen] = useState(false)
  const [confirmSendOpen, setConfirmSendOpen] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [previewMode, setPreviewMode] = useState<'pdf' | 'email'>('pdf')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState<'draft' | 'send' | null>(null)

  const form = useForm<InvoiceInput>({
    resolver: zodResolver(invoiceInputSchema),
    defaultValues: initialValues(org, invoice, defaultClientId),
    mode: 'onTouched',
  })
  const { control, register, handleSubmit, setValue, getFieldState, formState } = form
  const { errors, isDirty } = formState
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  const tNav = useTranslations('nav')
  const values = useWatch({ control }) as InvoiceInput
  const preview = useMemo(() => previewData(values, org, clients), [values, org, clients])
  const currency = values.currency
  const selectedClient = clients.find((c) => c.id === values.clientId)
  const predictedNumber =
    invoice?.number ??
    `${org.invoicePrefix}-${(values.issueDate || todayISO()).slice(0, 4)}-${String(org.nextInvoiceNumber).padStart(4, '0')}`

  // L'échéance suit la date d'émission tant que l'utilisateur ne l'a pas modifiée.
  useEffect(() => {
    if (values.issueDate && !getFieldState('dueDate').isDirty) {
      setValue('dueDate', addDays(values.issueDate, org.paymentTermsDays))
    }
  }, [values.issueDate, org.paymentTermsDays, setValue, getFieldState])

  // Avertit avant de quitter avec des modifications non enregistrées.
  useEffect(() => {
    if (!isDirty || submitting) return
    const handler = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty, submitting])

  function toggle(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function submit(send: boolean) {
    return handleSubmit(
      (data) => {
        setSubmitting(send ? 'send' : 'draft')
        run(() => saveInvoiceAction(data, { id: invoice?.id, send }), {
          refresh: false,
          success: (r) => (send ? t('issued', { number: r.number ?? '' }) : t('draftSaved')),
          onSuccess: (r) => router.push(`/invoices/${r.id}`),
          onError: () => setSubmitting(null),
        })
        setConfirmSendOpen(false)
      },
      (errs) => {
        setConfirmSendOpen(false)
        toast.error(e(firstError(errs)) ?? t('checkForm'))
      }
    )()
  }

  const busy = pending || submitting !== null

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-5',
        showPreview && 'xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]'
      )}
    >
      {/* ───────────── Formulaire ───────────── */}
      <form className="card min-w-0 p-5 sm:p-6" onSubmit={(e) => e.preventDefault()} noValidate>
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
          <Link href="/invoices" className="transition-colors hover:text-[var(--text-primary)]">
            {tNav('invoices')}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <span aria-current="page" className="truncate font-medium text-[var(--text-primary)]">
            {invoice ? t('editTitle') : t('createTitle')}
          </span>
        </nav>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">
              {invoice ? t('editTitle') : t('createTitle')}
            </h1>
            <p className="mt-0.5 text-sm text-[var(--text-muted)]">
              {invoice
                ? t('editSubtitle')
                : t('createSubtitle')}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--border)] px-3 py-1.5">
            <Switch label={t('preview')} checked={showPreview} onCheckedChange={setShowPreview} />
          </div>
        </div>

        {/* Type de facture */}
        <div className="mt-5 grid grid-cols-3 rounded-lg bg-gray-100 p-1 dark:bg-dark-elevated">
          {[t('types.standard'), t('types.split'), t('types.recurring')].map((label, i) => (
            <button
              key={label}
              type="button"
              disabled={i > 0}
              title={i > 0 ? t('comingSoon') : undefined}
              className={cn(
                'rounded-md py-1.5 text-sm font-medium transition-all',
                i === 0
                  ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xs'
                  : 'cursor-not-allowed text-[var(--text-muted)] opacity-60'
              )}
            >
              {label}
              {i > 0 && <span className="ms-1.5 hidden text-[10px] sm:inline">· {t('soon')}</span>}
            </button>
          ))}
        </div>

        {/* Informations */}
        <section className="mt-6 space-y-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            {t('infoTitle')}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              variant="floating"
              label={t('issuer')}
              value={org.name}
              readOnly
              leftIcon={<Building2 className="h-4 w-4" />}
              hint={t('issuerHint')}
            />
            <Controller
              control={control}
              name="clientId"
              render={({ field, fieldState }) => (
                <Select
                  value={field.value || undefined}
                  onValueChange={(v) =>
                    v === '__new__' ? setClientDialogOpen(true) : field.onChange(v)
                  }
                >
                  <SelectTrigger
                    variant="floating"
                    label={t('billedTo')}
                    error={e(fieldState.error?.message)}
                    onBlur={field.onBlur}
                    leftIcon={
                      selectedClient ? (
                        <ClientAvatar name={selectedClient.name} size="sm" />
                      ) : (
                        <UserPlus className="h-4 w-4" />
                      )
                    }
                  >
                    <SelectValue placeholder={t('chooseClient')}>
                      {clients.find((c) => c.id === field.value)?.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <span className="flex items-center gap-2">
                          <ClientAvatar name={c.name} size="xs" />
                          {c.name}
                        </span>
                      </SelectItem>
                    ))}
                    {clients.length > 0 && <SelectSeparator />}
                    <SelectItem value="__new__" className="font-medium text-primary-600">
                      <span className="flex items-center gap-1.5">
                        <UserPlus className="h-3.5 w-3.5" /> {t('newClient')}
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <Input
              variant="floating"
              label={t('issueDate')}
              type="date"
              leftIcon={<CalendarDays className="h-4 w-4" />}
              error={e(errors.issueDate?.message)}
              {...register('issueDate')}
            />
            <Input
              variant="floating"
              label={t('dueDate')}
              type="date"
              leftIcon={<CalendarDays className="h-4 w-4" />}
              error={e(errors.dueDate?.message)}
              {...register('dueDate')}
            />
          </div>
          <Input
            variant="floating"
            label={t('number')}
            value={invoice?.number ?? ''}
            placeholder={predictedNumber}
            readOnly
            leftIcon={<Hash className="h-4 w-4" />}
            hint={t('numberHint')}
          />
        </section>

        <div className="my-6 border-t border-[var(--border)]" />

        {/* Lignes */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            {t('itemsTitle')}
          </h2>
          <Controller
            control={control}
            name="currency"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  variant="floating"
                  label={t('currency')}
                  leftIcon={<CurrencyBadge currency={field.value} />}
                >
                  <SelectValue>{tCur(field.value)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <span className="flex items-center gap-2">
                        <CurrencyBadge currency={c.value} size="xs" />
                        {tCur(c.value)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />

          {fields.map((field, idx) => {
            const isCollapsed = collapsed.has(field.id)
            const itemErrors = errors.items?.[idx]
            const line = preview.items[idx]
            return (
              <div
                key={field.id}
                className={cn(
                  'rounded-xl border bg-[var(--bg-card)]',
                  itemErrors ? 'border-danger-300 dark:border-danger-700' : 'border-[var(--border)]'
                )}
              >
                <div className="flex items-center gap-2 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggle(field.id)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-start"
                  >
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {t('item', { n: idx + 1 })}
                    </span>
                    {isCollapsed && (
                      <span className="truncate text-sm text-[var(--text-muted)]">
                        · {values.items?.[idx]?.description || t('untitled')} ·{' '}
                        {line ? fmt.money(line.lineTotal, currency) : ''}
                      </span>
                    )}
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => remove(idx)}
                    disabled={fields.length === 1}
                    aria-label={t('removeItem', { n: idx + 1 })}
                    className="hover:text-danger-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => toggle(field.id)}
                    aria-label={isCollapsed ? t('expand') : t('collapse')}
                  >
                    {isCollapsed ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {!isCollapsed && (
                  <div className="space-y-3 border-t border-[var(--border-muted)] px-4 pb-4 pt-3">
                    <Input
                      variant="floating"
                      label={t('description')}
                      placeholder={t('descriptionPlaceholder')}
                      leftIcon={<Package className="h-4 w-4" />}
                      error={e(itemErrors?.description?.message)}
                      {...register(`items.${idx}.description`)}
                    />
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_1.6fr]">
                      <Input
                        variant="floating"
                        label={t('quantity')}
                        leftIcon={<Layers className="h-4 w-4" />}
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="any"
                        error={e(itemErrors?.quantity?.message)}
                        {...register(`items.${idx}.quantity`, { valueAsNumber: true })}
                      />
                      <Controller
                        control={control}
                        name={`items.${idx}.taxRate`}
                        render={({ field: f }) => (
                          <Select
                            value={String(f.value)}
                            onValueChange={(v) => f.onChange(Number(v))}
                          >
                            <SelectTrigger
                              variant="floating"
                              label={t('tax')}
                              leftIcon={<Percent className="h-4 w-4" />}
                            >
                              <SelectValue>{fmt.number(Number(f.value))} %</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from(new Set([...TAX_RATES, org.defaultTaxRate, f.value]))
                                .filter(Number.isFinite)
                                .sort((a, b) => a - b)
                                .map((r) => (
                                  <SelectItem key={r} value={String(r)}>
                                    {fmt.number(r)} %
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      <Input
                        variant="floating"
                        label={t('unitPrice')}
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="any"
                        leftIcon={<Coins className="h-4 w-4" />}
                        className="col-span-2 sm:col-span-1"
                        error={e(itemErrors?.unitPrice?.message)}
                        {...register(`items.${idx}.unitPrice`, { valueAsNumber: true })}
                      />
                    </div>
                    <p className="text-end text-xs text-[var(--text-muted)]">
                      {t('lineTotal')}{' '}
                      <span className="font-semibold text-[var(--text-primary)]">
                        {line ? fmt.money(line.lineTotal, currency) : '—'}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )
          })}

          {errors.items?.root?.message && (
            <p className="text-xs text-danger-600">{e(errors.items.root.message)}</p>
          )}
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            disabled={fields.length >= 100}
            onClick={() =>
              append({ description: '', quantity: 1, unitPrice: 0, taxRate: org.defaultTaxRate })
            }
          >
            <Plus className="h-4 w-4" /> {t('addItem')}
          </Button>
        </section>

        <div className="my-6 border-t border-[var(--border)]" />

        {/* Remise & notes */}
        <section className="space-y-4">
          <Controller
            control={control}
            name="discountType"
            render={({ field }) => (
              <div className="flex min-h-[52px] flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] px-4 py-2.5">
                <label className="flex flex-1 cursor-pointer items-center gap-2.5 text-sm font-medium text-[var(--text-primary)]">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 accent-primary-600"
                    checked={field.value !== 'none'}
                    onChange={(e) => field.onChange(e.target.checked ? 'percent' : 'none')}
                  />
                  {t('addDiscount')}
                </label>
                {field.value !== 'none' && (
                  <div className="flex items-start gap-2">
                    <div className="w-36">
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger aria-label={t('discountType')}>
                          <SelectValue>
                            {field.value === 'fixed' ? t('fixed') : t('percent')}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percent">{t('percent')}</SelectItem>
                          <SelectItem value="fixed">{t('fixed')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-32">
                      <Input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="any"
                        aria-label={t('discountValue')}
                        rightIcon={
                          field.value === 'percent' ? (
                            <Percent className="h-3.5 w-3.5" />
                          ) : (
                            <span className="text-xs">{currency}</span>
                          )
                        }
                        error={e(errors.discountValue?.message)}
                        {...register('discountValue', { valueAsNumber: true })}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          />
          <Textarea
            label={t('notes')}
            placeholder={t('notesPlaceholder')}
            rows={3}
            {...register('notes')}
          />
        </section>

        {/* Actions (mobile / sans aperçu) */}
        <div
          className={cn(
            'mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
            showPreview && 'xl:hidden'
          )}
        >
          <Button
            type="button"
            variant="outline"
            onClick={() => submit(false)}
            loading={submitting === 'draft'}
            disabled={busy}
          >
            {t('saveDraft')}
          </Button>
          <Button
            type="button"
            onClick={() => setConfirmSendOpen(true)}
            disabled={busy}
            loading={submitting === 'send'}
          >
            <Send className="h-4 w-4" /> {t('send')}
          </Button>
        </div>
      </form>

      {/* ───────────── Aperçu ───────────── */}
      {showPreview && (
        <aside className="min-w-0">
          <div className="sticky top-20 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">{t('preview')}</h2>
                <div
                  role="tablist"
                  aria-label={t('preview')}
                  className="flex rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-0.5"
                >
                  {(
                    [
                      { value: 'email', label: t('previewEmail'), icon: Mail },
                      { value: 'pdf', label: 'PDF', icon: FileText },
                    ] as const
                  ).map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      role="tab"
                      aria-selected={previewMode === value}
                      onClick={() => setPreviewMode(value)}
                      className={cn(
                        'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                        previewMode === value
                          ? 'bg-gray-100 text-[var(--text-primary)] dark:bg-dark-elevated'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="hidden gap-2 xl:flex">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => submit(false)}
                  loading={submitting === 'draft'}
                  disabled={busy}
                >
                  {t('saveDraft')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setConfirmSendOpen(true)}
                  loading={submitting === 'send'}
                  disabled={busy}
                >
                  <Send className="h-3.5 w-3.5" /> {t('send')}
                </Button>
              </div>
            </div>
            <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-gray-100 px-3 pb-4 pt-6 dark:bg-dark-elevated sm:px-6 sm:pb-6 sm:pt-8">
              {/* Pile de feuilles derrière le document */}
              <div className="relative">
                <div
                  aria-hidden
                  className="absolute inset-0 -translate-y-4 translate-x-4 rotate-[1.2deg] rounded-lg bg-white/60 shadow-sm dark:bg-white/10 rtl:-translate-x-4 rtl:-rotate-[1.2deg]"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 -translate-y-2 translate-x-2 rotate-[0.6deg] rounded-lg bg-white/80 shadow-sm dark:bg-white/20 rtl:-translate-x-2 rtl:-rotate-[0.6deg]"
                />
                {previewMode === 'pdf' ? (
                  <InvoiceDocument data={preview} className="relative rounded-lg shadow-md" />
                ) : (
                  <InvoiceEmailPreview
                    data={preview}
                    number={predictedNumber}
                    className="relative rounded-lg shadow-md"
                  />
                )}
              </div>
            </div>
          </div>
        </aside>
      )}

      <ClientDialog
        open={clientDialogOpen}
        onOpenChange={setClientDialogOpen}
        onSaved={(c) => {
          setClients((prev) => [...prev, c].sort((a, b) => a.name.localeCompare(b.name)))
          setValue('clientId', c.id, { shouldDirty: true, shouldValidate: true })
        }}
      />

      <ConfirmDialog
        open={confirmSendOpen}
        onOpenChange={setConfirmSendOpen}
        title={t('confirmTitle')}
        description={
          <span>
            {t('confirmDescription')}
            <br />
            {t('confirmAmount')}{' '}
            <strong className="text-[var(--text-primary)]">
              {fmt.money(preview.total, currency)}
            </strong>
          </span>
        }
        confirmLabel={t('confirmButton')}
        loading={submitting === 'send'}
        onConfirm={() => submit(true)}
      />
    </div>
  )
}
