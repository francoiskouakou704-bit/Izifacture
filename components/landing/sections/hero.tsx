import { cta, hero, ROUTES } from '../content'
import { Container } from '../ui/container'
import { CtaButton } from '../ui/cta-button'
import { HeroMockup } from './hero-mockup'

/** Délai de l'animation d'entrée, pour faire apparaître les blocs l'un après l'autre. */
const delay = (ms: number) => ({ '--lp-delay': `${ms}ms` }) as React.CSSProperties

/** Haut de page : annonce, titre, sous-titre, boutons, points forts, aperçu de l'app. */
export function Hero() {
  return (
    <section className="relative overflow-hidden pb-24 pt-12 lg:pb-32 lg:pt-16">
      {/* Halo de fond */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 flex justify-center">
        <div className="h-[550px] w-[850px] max-w-full rounded-full bg-gradient-to-b from-blue-50/60 to-transparent opacity-70 blur-3xl" />
      </div>

      <Container className="text-center">
        <div
          style={delay(0)}
          className="lp-enter mb-8 inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm"
        >
          <span aria-hidden className="text-amber-500">
            ⚡
          </span>
          {hero.announcement}
        </div>

        <h1
          style={delay(80)}
          className="lp-enter mx-auto max-w-4xl text-4xl font-extrabold leading-[1.15] tracking-tight text-ink sm:text-5xl lg:text-6xl"
        >
          {hero.title[0]}
          <br className="hidden sm:inline" /> {hero.title[1]}
        </h1>

        <p style={delay(160)} className="lp-enter mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl">
          {hero.subtitle.map((part, i) =>
            part.strong ? (
              <strong key={i} className="font-semibold text-slate-900">
                {part.text}
              </strong>
            ) : (
              <span key={i}>{part.text}</span>
            )
          )}
        </p>

        <div style={delay(240)} className="lp-enter mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <CtaButton href={ROUTES.signup} className="w-full sm:w-auto">
            {cta.start}
          </CtaButton>
          <CtaButton href="#demo" variant="outline" className="w-full sm:w-auto">
            <svg aria-hidden className="h-4 w-4 fill-current text-slate-600" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            {cta.demo}
          </CtaButton>
        </div>

        <div style={delay(320)} className="lp-enter mt-10 flex flex-col items-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">{hero.highlightsLabel}</p>
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 sm:gap-x-10">
            {hero.highlights.map((b) => (
              <li key={b.name} className="flex items-center gap-1.5 text-sm font-semibold tracking-tight text-slate-700">
                <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${b.dot}`} />
                {b.name}
              </li>
            ))}
          </ul>
        </div>

        <div style={delay(400)} className="lp-enter">
          <HeroMockup />
        </div>
      </Container>
    </section>
  )
}
