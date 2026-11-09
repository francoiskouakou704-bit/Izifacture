import { finalCta, ROUTES } from '../content'
import { CtaButton } from '../ui/cta-button'
import { Reveal } from '../ui/reveal'
import { Section } from '../ui/section'

/** Bannière finale sur fond indigo : dernière invitation à s'inscrire. */
export function CtaBanner() {
  return (
    <Section id="commencer" background="ink" containerClassName="relative z-10 max-w-4xl text-center" className="overflow-hidden lg:py-24">
      <div aria-hidden className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-emerald-600/10 blur-3xl" />

      <Reveal>
        <span className="mb-6 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-200">
          {finalCta.badge}
        </span>
        <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">{finalCta.title}</h2>
        <p className="mx-auto mt-6 max-w-2xl text-base text-slate-300 sm:text-lg">{finalCta.subtitle}</p>
        <div className="mt-10 flex justify-center">
          <CtaButton href={ROUTES.signup} variant="light" size="lg" className="w-full sm:w-auto">
            {finalCta.button}
          </CtaButton>
        </div>
        <p className="mt-4 text-xs text-slate-400">{finalCta.note}</p>
      </Reveal>
    </Section>
  )
}
