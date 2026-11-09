'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { cta, nav, ROUTES } from '../content'
import { Container } from '../ui/container'
import { CtaButton } from '../ui/cta-button'
import { Logo } from '../ui/logo'

/** En-tête collant : ombre au défilement, navigation par ancres, menu déroulant sur mobile. */
export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Échap ferme le menu mobile
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const close = () => setOpen(false)

  return (
    <header
      data-scrolled={scrolled || open}
      className="lp-header sticky top-0 z-50 border-b border-slate-100 bg-[#fafbfc]/85 backdrop-blur-md"
    >
      <Container>
        <div className="flex h-[var(--lp-header-h)] items-center justify-between gap-4">
          <Logo withBadge />

          <nav aria-label="Sections" className="hidden items-center gap-8 text-[15px] font-medium text-slate-600 md:flex">
            {nav.map((item) => (
              <CtaButton key={item.href} href={item.href} variant="ghost" className="lp-nav-link rounded-none font-medium text-slate-600">
                {item.label}
              </CtaButton>
            ))}
          </nav>

          <div className="flex items-center gap-3 sm:gap-4">
            <CtaButton href={ROUTES.login} variant="ghost" className="hidden text-[15px] sm:inline-flex">
              {cta.login}
            </CtaButton>
            <CtaButton href={ROUTES.signup} size="sm" className="hidden min-[400px]:inline-flex">
              {cta.start}
            </CtaButton>
            <button
              type="button"
              aria-label="Menu"
              aria-expanded={open}
              aria-controls="lp-mobile-menu"
              onClick={() => setOpen((o) => !o)}
              className="lp-burger -me-2 rounded-lg p-2 text-ink transition-colors hover:bg-slate-100 md:hidden"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </Container>

      <div id="lp-mobile-menu" data-open={open} className="lp-mobile-menu md:hidden" inert={!open}>
        <div>
          <Container className="flex flex-col gap-1 pb-5 pt-1">
            {nav.map((item) => (
              <CtaButton
                key={item.href}
                href={item.href}
                variant="ghost"
                onNavigate={close}
                className={cn(
                  'justify-start rounded-xl px-3 py-3 text-base font-medium text-slate-700 hover:bg-slate-100',
                  open && 'lp-enter'
                )}
              >
                {item.label}
              </CtaButton>
            ))}
            <div className="mt-3 grid grid-cols-1 gap-2 border-t border-slate-100 pt-4 min-[400px]:grid-cols-2">
              <CtaButton href={ROUTES.login} variant="outline" size="sm" onNavigate={close}>
                {cta.login}
              </CtaButton>
              <CtaButton href={ROUTES.signup} size="sm" onNavigate={close}>
                {cta.start}
              </CtaButton>
            </div>
          </Container>
        </div>
      </div>
    </header>
  )
}
