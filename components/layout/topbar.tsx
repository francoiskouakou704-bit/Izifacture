'use client'

import { Menu, Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { GlobalSearch } from './global-search'
import { Sidebar, type SidebarAccount } from './sidebar'

export function Topbar({ account }: { account: SidebarAccount }) {
  const t = useTranslations('nav')
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  // Ferme le menu mobile à chaque navigation
  useEffect(() => setMobileOpen(false), [pathname])

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[var(--border)] bg-[var(--bg-card)]/90 px-4 backdrop-blur-sm sm:px-6">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label={t('openMenu')}
          className="shrink-0 rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-gray-100 dark:hover:bg-dark-elevated lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex min-w-0 flex-1">
          <GlobalSearch />
        </div>

        {!pathname.startsWith('/invoices/new') && (
          <Button asChild size="sm" className="shrink-0">
            <Link href="/invoices/new" aria-label={t('newInvoice')}>
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('newInvoice')}</span>
            </Link>
          </Button>
        )}
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute start-0 top-0 h-full w-72 animate-slide-in-left">
            <Sidebar account={account} mobile onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}
