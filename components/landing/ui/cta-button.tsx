'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

const variants = {
  /** Indigo profond, texte blanc (action principale) */
  dark: 'bg-ink text-white shadow-pill hover:bg-ink-soft',
  /** Blanc bordé (action secondaire) */
  outline: 'border border-slate-200/90 bg-white text-slate-800 shadow-sm hover:bg-slate-50',
  /** Blanc sur fond sombre (bannière finale) */
  light: 'bg-white text-ink shadow-xl hover:bg-slate-100',
  /** Lien texte sans fond */
  ghost: 'text-slate-700 hover:text-ink',
} as const

const sizes = {
  sm: 'px-5 py-2.5 text-sm',
  md: 'px-7 py-3.5 text-base',
  lg: 'px-8 py-4 text-base font-bold',
} as const

/** Onde qui part du point de clic. */
function ripple(event: React.MouseEvent<HTMLElement>) {
  const target = event.currentTarget
  const rect = target.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height) * 2
  const wave = document.createElement('span')
  wave.className = 'lp-ripple'
  wave.style.width = wave.style.height = `${size}px`
  wave.style.left = `${event.clientX - rect.left - size / 2}px`
  wave.style.top = `${event.clientY - rect.top - size / 2}px`
  target.appendChild(wave)
  wave.addEventListener('animationend', () => wave.remove())
  setTimeout(() => wave.remove(), 800) // filet de sécurité (animations désactivées)
}

/** Défilement doux vers une ancre de la page (#faq…), en respectant « réduire les animations ». */
function scrollToHash(hash: string) {
  const el = document.getElementById(hash.slice(1))
  if (!el) return false
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  history.replaceState(null, '', hash)
  return true
}

/**
 * Bouton-lien de la landing : enfoncement + onde au clic, défilement doux pour les ancres.
 * Les liens vers d'autres pages (/signup…) passent par le routeur Next.
 */
export function CtaButton({
  href,
  variant = 'dark',
  size = 'md',
  className,
  onNavigate,
  children,
}: {
  href: string
  variant?: keyof typeof variants
  size?: keyof typeof sizes
  className?: string
  /** Appelé après le clic (ex. fermer le menu mobile) */
  onNavigate?: () => void
  children: React.ReactNode
}) {
  const classes = cn(
    'lp-btn inline-flex items-center justify-center gap-2 rounded-full font-semibold',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
    variant !== 'ghost' && sizes[size],
    variants[variant],
    className
  )

  function onClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (variant !== 'ghost') ripple(event)
    if (href.startsWith('#') && scrollToHash(href)) event.preventDefault()
    onNavigate?.()
  }

  if (href.startsWith('#')) {
    return (
      <a href={href} onClick={onClick} className={classes}>
        {children}
      </a>
    )
  }
  return (
    <Link href={href} onClick={onClick} className={classes}>
      {children}
    </Link>
  )
}
