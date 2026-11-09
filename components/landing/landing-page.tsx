import { CtaBanner } from './sections/cta-banner'
import { FaqSection } from './sections/faq-section'
import { FeaturesSection } from './sections/features-section'
import { Hero } from './sections/hero'
import { ProblemsSection } from './sections/problems-section'
import { SiteFooter } from './sections/site-footer'
import { SiteHeader } from './sections/site-header'
import { TestimonialsSection } from './sections/testimonials-section'

/** Landing page publique : assemblage des sections, dans l'ordre d'affichage. */
export function LandingPage() {
  return (
    // Contenu rédigé en français : `lang` local pour les lecteurs d'écran, quelle que soit la langue de l'app
    <div lang="fr" dir="ltr" className="lp-root antialiased">
      <SiteHeader />
      <main>
        <Hero />
        <ProblemsSection />
        <FeaturesSection />
        <TestimonialsSection />
        <FaqSection />
        <CtaBanner />
      </main>
      <SiteFooter />
    </div>
  )
}
