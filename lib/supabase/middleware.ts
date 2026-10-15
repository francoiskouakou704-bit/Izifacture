import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config'

/** Rafraîchit la session (cookies) et renvoie l'utilisateur courant. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(toSet) {
        for (const { name, value } of toSet) request.cookies.set(name, value)
        response = NextResponse.next({ request })
        for (const { name, value, options } of toSet) response.cookies.set(name, value, options)
      },
    },
  })
  // getClaims rafraîchit la session si besoin puis vérifie le JWT localement (clés asymétriques) :
  // la navigation n'attend plus un appel réseau à Supabase Auth.
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims?.sub ? { id: data.claims.sub } : null
  return { response: () => response, user }
}
