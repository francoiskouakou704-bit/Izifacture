'use client'

import * as TabsPrimitive from '@radix-ui/react-tabs'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { GoogleButton } from './google-button'
import { LoginForm } from './login-form'
import { SignupForm } from './signup-form'

type Tab = 'login' | 'signup'

/**
 * Connexion et inscription dans une même carte : l'onglet bascule sans rechargement,
 * et l'URL suit (/login ↔ /signup, paramètres conservés) pour rester partageable.
 */
export function AuthPanel({ defaultTab, next, linkError }: { defaultTab: Tab; next: string; linkError?: boolean }) {
  const t = useTranslations('auth')
  const [tab, setTab] = useState<Tab>(defaultTab)

  function select(value: string) {
    const nextTab = value as Tab
    setTab(nextTab)
    window.history.replaceState(null, '', `/${nextTab}${window.location.search}`)
  }

  const triggerClass = cn(
    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
    'data-[state=active]:bg-[var(--bg-elevated)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:shadow-sm'
  )

  return (
    <TabsPrimitive.Root value={tab} onValueChange={select}>
      <TabsPrimitive.List className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-[var(--bg-primary)] p-1">
        <TabsPrimitive.Trigger value="login" className={triggerClass}>
          {t('tabLogin')}
        </TabsPrimitive.Trigger>
        <TabsPrimitive.Trigger value="signup" className={triggerClass}>
          {t('tabSignup')}
        </TabsPrimitive.Trigger>
      </TabsPrimitive.List>
      <TabsPrimitive.Content value="login" className="space-y-4 focus-visible:outline-none">
        <LoginForm next={next} linkError={linkError} />
        <GoogleButton next={next} />
      </TabsPrimitive.Content>
      <TabsPrimitive.Content value="signup" className="space-y-4 focus-visible:outline-none">
        <SignupForm onBackToLogin={() => select('login')} />
        <GoogleButton next="/onboarding" />
      </TabsPrimitive.Content>
    </TabsPrimitive.Root>
  )
}
