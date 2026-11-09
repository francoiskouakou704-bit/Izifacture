'use client'

import { Apple, Info, Monitor, Smartphone, Terminal } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { download, type Platform } from '../content'
import { CtaButton } from '../ui/cta-button'
import { Reveal } from '../ui/reveal'
import { Section, SectionHeader } from '../ui/section'

const icons: Record<Platform, typeof Monitor> = { windows: Monitor, mac: Apple, linux: Terminal }

type Detected = Platform | 'mobile' | null

/** Système du visiteur, d'après le navigateur (null tant qu'il n'est pas connu). */
function detectPlatform(): Detected {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string; mobile?: boolean } }
  const ua = navigator.userAgent
  if (nav.userAgentData?.mobile || /Android|iPhone|iPad|iPod/i.test(ua)) return 'mobile'
  const platform = (nav.userAgentData?.platform || navigator.platform || ua).toLowerCase()
  if (platform.includes('win')) return 'windows'
  if (platform.includes('mac')) return navigator.maxTouchPoints > 1 ? 'mobile' : 'mac' // iPadOS se présente comme un Mac
  if (platform.includes('linux') || platform.includes('x11')) return 'linux'
  return null
}

/** Carte de téléchargement d'un système : icône, prérequis, bouton et variante éventuelle. */
export function PlatformCard({
  platform,
  recommended,
}: {
  platform: (typeof download.platforms)[number]
  recommended: boolean
}) {
  const Icon = icons[platform.id]
  return (
    <article
      className={cn(
        'lp-card relative flex h-full flex-col items-center rounded-3xl border bg-white p-6 text-center sm:p-8',
        recommended ? 'border-ink shadow-floating ring-1 ring-ink' : 'border-slate-200/80 shadow-subtle-card'
      )}
    >
      {recommended && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-3 py-1 text-[11px] font-semibold text-white">
          {download.recommended}
        </span>
      )}
      <span aria-hidden className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-ink">
        <Icon className="h-7 w-7" />
      </span>
      <h3 className="text-xl font-bold text-ink">{platform.name}</h3>
      <p className="mt-1 flex-1 text-sm text-slate-500">{platform.requirements}</p>
      <CtaButton href={platform.href} variant={recommended ? 'dark' : 'outline'} size="sm" className="mt-6 w-full">
        {platform.button}
      </CtaButton>
      <p className="mt-3 text-xs text-slate-400">
        {platform.format}
        {platform.alternative && (
          <>
            {' · '}
            <a href={platform.alternative.href} className="font-medium text-blue-600 underline-offset-2 hover:underline">
              {platform.alternative.label}
            </a>
          </>
        )}
      </p>
    </article>
  )
}

export function DownloadSection() {
  const [detected, setDetected] = useState<Detected>(null)
  useEffect(() => setDetected(detectPlatform()), [])

  return (
    <Section id="telecharger">
      <SectionHeader eyebrow={download.eyebrow} title={download.title} subtitle={download.subtitle} />

      {detected === 'mobile' && (
        <p className="mx-auto -mt-4 mb-10 flex max-w-xl items-start gap-2 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-start text-sm text-blue-800">
          <Smartphone aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
          {download.mobileNote}
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 pt-3 md:grid-cols-3 lg:gap-8">
        {download.platforms.map((p, i) => (
          <Reveal key={p.id} delay={i * 120}>
            <PlatformCard platform={p} recommended={detected === p.id} />
          </Reveal>
        ))}
      </div>

      <Reveal className="mx-auto mt-10 max-w-3xl space-y-2 text-sm text-slate-500">
        {download.notes.map((note) => (
          <p key={note} className="flex items-start gap-2">
            <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            {note}
          </p>
        ))}
        <p className="ps-6">
          <a href={download.allVersions.href} className="font-medium text-blue-600 underline-offset-2 hover:underline">
            {download.allVersions.label} →
          </a>
        </p>
      </Reveal>
    </Section>
  )
}
