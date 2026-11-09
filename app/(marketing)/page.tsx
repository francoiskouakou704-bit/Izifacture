import type { Metadata } from 'next'
import { LandingPage } from '@/components/landing/landing-page'

export const metadata: Metadata = {
  title: { absolute: 'iziFacture — Facturation moderne pour entrepreneurs africains' },
  description:
    'Solution SaaS de facturation conçue pour l’Afrique de l’Ouest : montants en FCFA, TVA 18% automatique et encaissement rapide.',
}

export default function HomePage() {
  return <LandingPage />
}
