import { cn } from '@/lib/utils'
import { features } from '../content'
import { IconTile } from '../ui/icon-tile'
import { Reveal } from '../ui/reveal'
import { Section, SectionHeader } from '../ui/section'
import { toneText, type Tone } from '../ui/tones'

/** Carte fonctionnalité : pastille, sur-titre, titre, description et encart de mise en avant. */
export function FeatureCard({
  tone,
  symbol,
  eyebrow,
  title,
  text,
  highlight,
  highlightNote,
}: {
  tone: Tone
  symbol: string
  eyebrow: string
  title: string
  text: string
  highlight: string
  highlightNote: string
}) {
  return (
    <article className="lp-card flex h-full flex-col rounded-3xl border border-slate-200/80 bg-white p-6 shadow-subtle-card hover:shadow-floating sm:p-8">
      <IconTile tone={tone} symbol={symbol} className="mb-6" />
      <span className={cn('text-xs font-bold uppercase tracking-wider', toneText[tone])}>{eyebrow}</span>
      <h3 className="mt-1 text-xl font-bold text-ink sm:text-2xl">{title}</h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600 sm:text-base">{text}</p>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-700">
        <span className="font-medium">{highlight}</span>
        <span className={cn('font-semibold', toneText[tone])}>{highlightNote}</span>
      </div>
    </article>
  )
}

export function FeaturesSection() {
  return (
    <Section id="fonctionnalites">
      <SectionHeader eyebrow={features.eyebrow} title={features.title} subtitle={features.subtitle} />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
        {features.items.map((item, i) => (
          <Reveal key={item.title} delay={(i % 2) * 120}>
            <FeatureCard {...item} />
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
