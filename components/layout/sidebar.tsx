'use client'

import { signOutAction } from '@/actions/auth'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, FileText, Users, Settings, HelpCircle,
  Moon, Sun, LogOut, Zap, X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { useState, useEffect } from 'react'
import { LocaleSwitcher } from './locale-switcher'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, key: 'dashboard' },
  { href: '/invoices', icon: FileText, key: 'invoices' },
  { href: '/clients', icon: Users, key: 'clients' },
  { href: '/settings', icon: Settings, key: 'settings' },
] as const

export interface SidebarAccount {
  fullName: string
  email: string
  avatarUrl?: string
  companyName: string
}

interface SidebarProps {
  account: SidebarAccount
  mobile?: boolean
  onClose?: () => void
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

export function Sidebar({ account, mobile = false, onClose }: SidebarProps) {
  const t = useTranslations('nav')
  const pathname = usePathname()
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = stored === 'dark' || (!stored && prefersDark)
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  function toggleDark() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  return (
    <aside className={cn(
      'flex h-full flex-col bg-[var(--bg-card)] border-e border-[var(--border)]',
      mobile ? 'w-full' : 'w-[260px] shrink-0'
    )}>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border)]">
        <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onClose}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 shadow-sm">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-bold text-[var(--text-primary)] tracking-tight">
            izi<span className="text-primary-600">facture</span>
          </span>
        </Link>
        {mobile && (
          <button onClick={onClose} aria-label={t('closeMenu')} className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-gray-100 dark:hover:bg-dark-elevated">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Entreprise */}
      <div className="px-4 pt-4">
        <Link
          href="/settings"
          onClick={onClose}
          className="block truncate rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-gray-50 dark:hover:bg-dark-elevated"
        >
          {account.companyName}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <p className="section-title">{t('menu')}</p>
        {navItems.map(({ href, icon: Icon, key }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn('nav-item', isActive && 'nav-item-active')}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{t(key)}</span>
              {isActive && <span className="ms-auto h-1.5 w-1.5 rounded-full bg-primary-600 dark:bg-primary-400" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-3 pt-2 border-t border-[var(--border)] space-y-1">
        <a href="mailto:support@izifacture.com" className="nav-item w-full">
          <HelpCircle className="h-4 w-4 shrink-0" />
          <span>{t('help')}</span>
        </a>
        <button onClick={toggleDark} className="nav-item w-full">
          {dark ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
          <span>{dark ? t('lightMode') : t('darkMode')}</span>
        </button>
        <LocaleSwitcher variant="sidebar" />

        {/* User card */}
        <div className="mt-2 rounded-xl bg-gray-50 dark:bg-dark-elevated border border-[var(--border)] p-3 flex items-center gap-2.5">
          {account.avatarUrl ? (
            // Photo du compte Google
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={account.avatarUrl}
              alt=""
              referrerPolicy="no-referrer"
              className="h-8 w-8 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials(account.fullName)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{account.fullName}</p>
            <p className="text-xs text-[var(--text-muted)] truncate">{account.email}</p>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              title={t('logout')}
              aria-label={t('logout')}
              className="flex text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  )
}
