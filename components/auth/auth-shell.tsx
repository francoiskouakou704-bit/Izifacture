import { Zap } from 'lucide-react'
import Link from 'next/link'
import { LocaleSwitcher } from '@/components/layout/locale-switcher'

/** Mise en page commune des écrans d'authentification. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[var(--bg-primary)] p-4">
      <LocaleSwitcher className="absolute end-4 top-4" />
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="mb-6 inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 shadow-md">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-[var(--text-primary)]">
              izi<span className="text-primary-600">facture</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-[var(--text-muted)]">{subtitle}</p>}
        </div>
        <div className="card p-6">{children}</div>
        {footer && <div className="mt-4 text-center text-sm text-[var(--text-muted)]">{footer}</div>}
      </div>
    </div>
  )
}
