import type { EmailOtpType } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { safeNextPath } from '@/lib/validations/auth'

// Retour des liens envoyés par e-mail (confirmation d'inscription, mot de passe oublié) :
// échange le code contre une session puis redirige vers `next`.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const next = safeNextPath(searchParams.get('next'))
  const supabase = await createSupabaseServerClient()

  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error('missing code') }

  if (error) return NextResponse.redirect(`${origin}/login?error=link`)
  return NextResponse.redirect(`${origin}${type === 'recovery' ? '/reset-password' : next}`)
}
