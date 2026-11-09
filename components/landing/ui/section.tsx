import { cn } from '@/lib/utils'
import { Container } from './container'
import { Reveal } from './reveal'

const backgrounds = {
  plain: '',
  white: 'bg-white border-y border-slate-100',
  ink: 'bg-ink text-white',
} as const

/** Section de page : ancre, fond, espacement vertical et conteneur. */
export function Section({
  id,
  background = 'plain',
  className,
  containerClassName,
  children,
}: {
  id?: string
  background?: keyof typeof backgrounds
  className?: string
  containerClassName?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className={cn('relative py-20 lg:py-28', backgrounds[background], className)}>
      <Container className={containerClassName}>{children}</Container>
    </section>
  )
}

/** Sur-titre coloré + titre + sous-titre, centrés. */
export function SectionHeader({
  eyebrow,
  eyebrowClass = 'text-blue-600',
  title,
  subtitle,
  className,
}: {
  eyebrow: string
  eyebrowClass?: string
  title: string
  subtitle?: string
  className?: string
}) {
  return (
    <Reveal className={cn('mx-auto mb-12 max-w-3xl text-center sm:mb-16', className)}>
      <span className={cn('text-xs font-bold uppercase tracking-widest', eyebrowClass)}>{eyebrow}</span>
      <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-4 text-base text-slate-600 sm:text-lg">{subtitle}</p>}
    </Reveal>
  )
}
