import { computeInvoiceTotals } from '@/lib/invoice-math'
import { addDays } from '@/lib/dates'
import { todayISO } from '@/lib/status'
import type {
  Client,
  Currency,
  CurrentUser,
  Invoice,
  InvoiceEvent,
  Organization,
  PartySnapshot,
  Payment,
  PaymentMethod,
  StoredInvoiceStatus,
} from '@/lib/types'

export interface MockDb {
  user: CurrentUser
  organization: Organization | null
  clients: Client[]
  invoices: Omit<Invoice, 'effectiveStatus' | 'clientName'>[]
  payments: Payment[]
  events: InvoiceEvent[]
}

// PRNG déterministe : même jeu de données à chaque démarrage.
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function toSnapshot(p: Client | Organization): PartySnapshot {
  return {
    name: p.name,
    email: p.email,
    phone: p.phone,
    address: p.address,
    city: p.city,
    country: p.country,
    taxId: p.taxId,
    logoUrl: 'logoUrl' in p ? p.logoUrl : undefined,
  }
}

const ORG_ID = 'org_demo'
const USER_ID = 'user_demo'

const CLIENTS: Omit<Client, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>[] = [
  { name: 'Koffi Anan Consulting', email: 'contact@koffianan.ci', phone: '+225 27 20 30 40 50', address: 'Rue des Jardins, Cocody', city: 'Abidjan', country: "Côte d'Ivoire", taxId: 'CI-ABJ-2019-B-04512' },
  { name: 'Dakar Tech Solutions', email: 'info@dakartech.sn', phone: '+221 77 123 45 67', address: 'Immeuble Fahd, Plateau', city: 'Dakar', country: 'Sénégal', taxId: 'NINEA 005873214' },
  { name: 'Lagos Merchants Ltd', email: 'accounts@lagosmerchants.ng', phone: '+234 803 000 1122', address: '14 Broad Street', city: 'Lagos', country: 'Nigeria' },
  { name: 'Abidjan Creatives', email: 'hello@abidjancreatives.ci', phone: '+225 07 07 12 34 56', city: 'Abidjan', country: "Côte d'Ivoire" },
  { name: 'Sahel Agro SARL', email: 'direction@sahelagro.ml', phone: '+223 76 45 32 10', address: 'ACI 2000', city: 'Bamako', country: 'Mali', taxId: 'NIF 084512369K' },
  { name: 'Ouaga Events', email: 'contact@ouagaevents.bf', phone: '+226 70 11 22 33', city: 'Ouagadougou', country: 'Burkina Faso' },
  { name: 'Lomé Logistique', email: 'compta@lomelog.tg', phone: '+228 90 12 34 56', address: 'Zone portuaire', city: 'Lomé', country: 'Togo' },
  { name: 'Paris Diaspora Conseil', email: 'facturation@pdc.fr', phone: '+33 1 84 00 00 00', city: 'Paris', country: 'France' },
]

const CATALOG = [
  { description: 'Création de site vitrine', price: 450_000 },
  { description: 'Maintenance mensuelle', price: 75_000 },
  { description: 'Identité visuelle (logo + charte)', price: 250_000 },
  { description: 'Campagne réseaux sociaux', price: 180_000 },
  { description: 'Formation équipe (journée)', price: 120_000 },
  { description: 'Hébergement annuel', price: 60_000 },
  { description: 'Audit SEO', price: 150_000 },
  { description: 'Développement application mobile (sprint)', price: 900_000 },
  { description: 'Shooting photo produits', price: 95_000 },
  { description: 'Rédaction de contenus (10 articles)', price: 110_000 },
]

export function createSeed(today = todayISO()): MockDb {
  const rand = mulberry32(42)
  const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)]
  const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1))
  const now = new Date().toISOString()

  const organization: Organization = {
    id: ORG_ID,
    name: 'Diallo Digital Services',
    email: 'contact@diallodigital.sn',
    phone: '+221 77 000 00 00',
    address: '12 Avenue Cheikh Anta Diop',
    city: 'Dakar',
    country: 'Sénégal',
    taxId: 'NINEA 007654321 2G3',
    defaultCurrency: 'XOF',
    defaultTaxRate: 18,
    invoicePrefix: 'INV',
    nextInvoiceNumber: 1,
    paymentTermsDays: 30,
    paymentInstructions:
      'Virement bancaire : SN012 01010 012345678901 23 (CBAO)\nOrange Money / Wave : +221 77 000 00 00',
    footerNote: 'Merci pour votre confiance. Pénalité de retard : 10 % par an.',
  }

  const clients: Client[] = CLIENTS.map((c, i) => ({
    ...c,
    id: `cli_${i + 1}`,
    organizationId: ORG_ID,
    createdAt: addDays(today, -220 + i * 5) + 'T09:00:00.000Z',
    updatedAt: now,
  }))

  const invoices: MockDb['invoices'] = []
  const payments: Payment[] = []
  const events: InvoiceEvent[] = []
  const methods: PaymentMethod[] = ['bank', 'mobile_money', 'mobile_money', 'cash']

  const COUNT = 48
  for (let n = 0; n < COUNT; n++) {
    // Réparti sur ~12 mois.
    const daysAgo = Math.floor((COUNT - 1 - n) * 7.6) + int(0, 3)
    const issueDate = addDays(today, -daysAgo)
    const dueDate = addDays(issueDate, pick([15, 30, 30, 45]))
    const client = n % 9 === 4 ? clients[7] : pick(clients.slice(0, 7))
    const currency: Currency = client.id === 'cli_8' ? 'EUR' : 'XOF'

    const lineCount = int(1, 4)
    const used = new Set<number>()
    const items = Array.from({ length: lineCount }, (_, idx) => {
      let k = int(0, CATALOG.length - 1)
      while (used.has(k)) k = (k + 1) % CATALOG.length
      used.add(k)
      const base = CATALOG[k]
      // XOF → EUR : 1 EUR = 655,957 XOF ; prix EUR en centimes arrondis à l'euro.
      const unitPrice = currency === 'EUR' ? Math.round(base.price / 655.957) * 100 : base.price
      return {
        id: `itm_${n + 1}_${idx + 1}`,
        position: idx,
        description: base.description,
        quantity: int(1, 3),
        unitPrice,
        taxRate: currency === 'EUR' ? 0 : 18,
      }
    })
    const discountType = n % 7 === 3 ? ('percent' as const) : null
    const discountValue = discountType ? 10 : 0
    const totals = computeInvoiceTotals(items, discountType, discountValue)

    // Statut selon l'ancienneté
    let status: StoredInvoiceStatus
    if (n >= COUNT - 2 || n === COUNT - 6) status = 'draft'
    else if (n === 17) status = 'cancelled'
    else if (daysAgo > 60) status = rand() < 0.9 ? 'paid' : 'sent'
    else status = rand() < 0.45 ? 'paid' : 'sent'

    const id = `inv_${n + 1}`
    const createdAt = issueDate + 'T10:00:00.000Z'
    const inv: MockDb['invoices'][number] = {
      id,
      organizationId: ORG_ID,
      clientId: client.id,
      number: null,
      status,
      issueDate,
      dueDate,
      currency,
      discountType,
      discountValue,
      subtotal: totals.subtotal,
      taxTotal: totals.taxTotal,
      discountTotal: totals.discountTotal,
      total: totals.total,
      amountPaid: 0,
      notes: 'Merci pour votre confiance.',
      publicToken: `pub_${(n + 1).toString(36)}_${Math.floor(rand() * 1e9).toString(36)}`,
      createdAt,
      updatedAt: createdAt,
      items: items.map((it, idx) => ({ ...it, ...totals.lines[idx] })),
    }
    events.push({ id: `evt_${id}_c`, invoiceId: id, type: 'created', actorName: 'Amadou Diallo', createdAt })

    if (status !== 'draft') {
      inv.sentAt = createdAt
      events.push({ id: `evt_${id}_s`, invoiceId: id, type: 'sent', actorName: 'Amadou Diallo', createdAt: issueDate + 'T10:05:00.000Z' })
      if (rand() < 0.7) {
        events.push({ id: `evt_${id}_v`, invoiceId: id, type: 'viewed', createdAt: addDays(issueDate, 1) + 'T08:30:00.000Z' })
      }
    }

    const pay = (amount: number, paidOn: string, k: number) => {
      const p: Payment = {
        id: `pay_${n + 1}_${k}`,
        invoiceId: id,
        amount,
        paidOn,
        method: pick(methods),
        reference: rand() < 0.5 ? `TX${int(100000, 999999)}` : undefined,
        createdAt: paidOn + 'T12:00:00.000Z',
      }
      payments.push(p)
      inv.amountPaid += amount
      events.push({ id: `evt_${p.id}`, invoiceId: id, type: 'payment', actorName: 'Amadou Diallo', payload: { amount, method: p.method }, createdAt: p.createdAt })
    }

    if (status === 'paid') {
      const paidOn = [addDays(issueDate, int(2, 35)), today].sort()[0]
      pay(inv.total, paidOn, 1)
      inv.paidAt = paidOn + 'T12:00:00.000Z'
    } else if (status === 'sent' && rand() < 0.3) {
      // Acompte partiel
      const paidOn = [addDays(issueDate, int(1, 10)), today].sort()[0]
      pay(Math.round(inv.total * 0.4), paidOn, 1)
    } else if (status === 'cancelled') {
      inv.cancelledAt = addDays(issueDate, 3) + 'T09:00:00.000Z'
      events.push({ id: `evt_${id}_x`, invoiceId: id, type: 'cancelled', actorName: 'Amadou Diallo', createdAt: inv.cancelledAt })
    }

    invoices.push(inv)
  }

  // Numérotation chronologique des factures émises
  invoices
    .filter((i) => i.status !== 'draft')
    .sort((a, b) => a.issueDate.localeCompare(b.issueDate))
    .forEach((inv) => {
      const year = inv.issueDate.slice(0, 4)
      inv.number = `${organization.invoicePrefix}-${year}-${String(organization.nextInvoiceNumber).padStart(4, '0')}`
      organization.nextInvoiceNumber++
      inv.clientSnapshot = toSnapshot(clients.find((c) => c.id === inv.clientId)!)
      inv.companySnapshot = toSnapshot(organization)
    })

  return {
    user: { id: USER_ID, fullName: 'Amadou Diallo', email: 'amadou@diallodigital.sn' },
    organization,
    clients,
    invoices,
    payments,
    events,
  }
}
