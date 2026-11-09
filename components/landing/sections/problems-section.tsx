import { cn } from '@/lib/utils'
import { problems } from '../content'
import { IconTile } from '../ui/icon-tile'
import { Reveal } from '../ui/reveal'
import { Section, SectionHeader } from '../ui/section'
import { toneText, type Tone } from '../ui/tones'

/** Carte « problème » : symptôme, explication et impact concret. */
export function ProblemCard({ tone, symbol, title, text, impact }: { tone: Tone; symbol: string; title: string; text: string; impact: string }) {
  return (
    <article className="lp-card flex h-full flex-col rounded-3xl border border-slate-100 bg-slate-50 p-6 hover:border-slate-200 sm:p-8">
      <IconTile tone={tone} symbol={symbol} className="mb-6" />
      <h3 className="text-xl font-bold tracking-tight text-slate-900">{title}</h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{text}</p>
      <p className={cn('mt-6 border-t border-slate-200 pt-4 text-xs font-semibold', toneText[tone])}>
        <span>Impact :</span> {impact}
      </p>
    </article>
  )
}

export function ProblemsSection() {
  return (
    <Section id="problemes" background="white">
      <SectionHeader eyebrow={problems.eyebrow} eyebrowClass="text-rose-500" title={problems.title} subtitle={problems.subtitle} />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
        {problems.items.map((item, i) => (
          <Reveal key={item.title} delay={i * 120}>
            <ProblemCard {...item} />
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
