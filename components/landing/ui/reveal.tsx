'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Fait apparaître son contenu (fondu + glissement) quand il entre à l'écran.
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
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window)) return setVisible(true)
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
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
      data-visible={visible}
      className={cn('lp-reveal', className)}
      style={{ '--lp-delay': `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </Comp>
  )
}
