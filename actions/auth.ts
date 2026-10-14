'use server'

import type { AuthError } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { DomainError } from '@/lib/data'
import { isSupabaseEnabled } from '@/lib/supabase/config'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  safeNextPath,
  signInSchema,
  signUpSchema,
} from '@/lib/validations/auth'
import { runAction } from './utils'

/** URL publique du site, pour les liens envoyés par e-mail. */
function siteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL
  if (configured) return configured.replace(/\/$/, '')
  const h = headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}

/** Erreurs Supabase Auth → clés de traduction. */
function authError(error: AuthError): never {
  const byCode: Record<string, string> = {
    invalid_credentials: 'auth.invalidCredentials',
    email_not_confirmed: 'auth.emailNotConfirmed',
    weak_password: 'validation.passwordMin',
    over_email_send_rate_limit: 'auth.rateLimited',
    over_request_rate_limit: 'auth.rateLimited',
    same_password: 'validation.passwordMin',
  }
  const key = (error.code && byCode[error.code]) || (error.status === 429 ? 'auth.rateLimited' : undefined)
  if (key) throw new DomainError(key)
  console.error('[auth]', error.code, error.message)
  throw new DomainError('errors.unexpected')
}

export async function signInAction(rawInput: unknown, next?: string) {
  return runAction(async () => {
    const data = signInSchema.parse(rawInput)
    if (isSupabaseEnabled()) {
      const { error } = await createSupabaseServerClient().auth.signInWithPassword(data)
      if (error) authError(error)
    }
    return { redirectTo: safeNextPath(next) }
  })
}

export async function signUpAction(rawInput: unknown) {
  return runAction(async () => {
    const data = signUpSchema.parse(rawInput)
    if (!isSupabaseEnabled()) return { needsConfirmation: false }
    const { data: result, error } = await createSupabaseServerClient().auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.fullName },
        emailRedirectTo: `${siteUrl()}/auth/callback?next=/onboarding`,
      },
    })
    if (error) authError(error)
    // Sans session : confirmation par e-mail requise (aussi renvoyé si l'adresse existe déjà,
    // pour ne pas révéler quels e-mails ont un compte).
    return { needsConfirmation: !result.session }
  })
}

/** Connexion / inscription Google (OAuth PKCE) : renvoie l'URL d'autorisation Google. */
export async function signInWithGoogleAction(next?: string) {
  return runAction(async () => {
    if (!isSupabaseEnabled()) return { url: safeNextPath(next) }
    const { data, error } = await createSupabaseServerClient().auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(safeNextPath(next))}`,
        queryParams: { prompt: 'select_account' },
      },
    })
    if (error || !data.url) {
      if (error) authError(error)
      throw new DomainError('errors.unexpected')
    }
    return { url: data.url }
  })
}

export async function signOutAction() {
  if (isSupabaseEnabled()) await createSupabaseServerClient().auth.signOut()
  redirect('/login')
}

export async function requestPasswordResetAction(rawInput: unknown) {
  return runAction(async () => {
    const { email } = forgotPasswordSchema.parse(rawInput)
    if (isSupabaseEnabled()) {
      const { error } = await createSupabaseServerClient().auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl()}/auth/callback?next=/reset-password`,
      })
      // Réponse identique que le compte existe ou non ; seules les limites sont signalées.
      if (error && error.status === 429) authError(error)
      if (error) console.error('[auth] reset', error.code, error.message)
    }
  })
}

export async function updatePasswordAction(rawInput: unknown) {
  return runAction(async () => {
    const { password } = resetPasswordSchema.parse(rawInput)
    if (isSupabaseEnabled()) {
      const { error } = await createSupabaseServerClient().auth.updateUser({ password })
      if (error) authError(error)
    }
  })
}
