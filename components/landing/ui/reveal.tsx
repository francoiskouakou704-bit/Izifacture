'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Fait apparaître son contenu (fondu + glissement) quand il entre à l'écran.
 * Le contenu est visible par défaut : il n'est masqué qu'une fois le JavaScript chargé,
 * et seulement s'il est encore sous l'écran — rien ne reste caché si le script tarde ou échoue.
 * `delay` (ms) décale l'apparition pour animer une grille carte par carte.
 */
export function Reveal({
  as: Tag = 'div',
  delay = 0,
  className,
  children,
}: {
  as?: 'div' | 'li' | 'article'
  delay?: number
  className?: string
  children: React.ReactNode
}) {
  // Les trois balises acceptent les mêmes attributs : on type comme un <div>
  const Comp = Tag as 'div'
  const ref = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<'idle' | 'hidden' | 'shown'>('idle')

  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // Déjà à l'écran : on ne le cache pas (pas de clignotement)
    if (el.getBoundingClientRect().top < window.innerHeight) return

    setState('hidden')
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState('shown')
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -10% 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <Comp
      ref={ref}
      data-reveal={state}
      className={cn('lp-reveal', className)}
      style={{ '--lp-delay': `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </Comp>
  )
}
