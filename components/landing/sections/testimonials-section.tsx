import { cn } from '@/lib/utils'
import { stats, testimonials } from '../content'
import { Reveal } from '../ui/reveal'
import { Section, SectionHeader } from '../ui/section'

/** Chiffre clé : grande valeur, libellé, précision. */
export function StatItem({ value, label, text }: { value: string; label: string; text: string }) {
  return (
    <div>
      <div className="text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">{value}</div>
      <div className="mt-2 text-sm font-semibold uppercase tracking-wider text-slate-400">{label}</div>
      <p className="mt-1 text-sm text-slate-600">{text}</p>
    </div>
  )
}

/** Avis client : note, citation, auteur. */
export function TestimonialCard({
  quote,
  name,
  role,
  initials,
  avatar,
}: {
  quote: string
  name: string
  role: string
  initials: string
  avatar: string
}) {
  return (
    <figure className="lp-card flex h-full flex-col justify-between rounded-3xl border border-slate-100 bg-slate-50 p-6 sm:p-8">
      <div>
        <div className="mb-4 flex text-sm text-amber-400" role="img" aria-label="5 étoiles sur 5">
          ★★★★★
        </div>
        <blockquote className="text-base italic leading-relaxed text-slate-700">« {quote} »</blockquote>
      </div>
      <figcaption className="mt-6 flex items-center gap-3 border-t border-slate-200 pt-6">
        <span aria-hidden className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white', avatar)}>
          {initials}
        </span>
        <span>
          <span className="block text-sm font-bold text-slate-900">{name}</span>
          <span className="block text-xs text-slate-500">{role}</span>
        </span>
      </figcaption>
    </figure>
  )
}

export function TestimonialsSection() {
  return (
    <Section id="temoignages" background="white" className="lg:py-20">
      <div className="grid grid-cols-1 gap-10 border-b border-slate-100 pb-16 text-center md:grid-cols-3 md:gap-8">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 120}>
            <StatItem {...s} />
          </Reveal>
        ))}
      </div>

      <div className="mt-16">
        <SectionHeader eyebrow={testimonials.eyebrow} eyebrowClass="text-emerald-600" title={testimonials.title} className="mb-12 max-w-2xl sm:mb-12" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
          {testimonials.items.map((t, i) => (
            <Reveal key={t.name} delay={i * 120}>
              <TestimonialCard {...t} />
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  )
}
