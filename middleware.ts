import { NextResponse, type NextRequest } from 'next/server'
import { isSupabaseEnabled } from '@/lib/supabase/config'
import { updateSession } from '@/lib/supabase/middleware'

// Pages accessibles sans session.
const PUBLIC_PREFIXES = ['/login', '/signup', '/forgot-password', '/auth', '/i/']
// Pages réservées aux visiteurs non connectés.
const GUEST_ONLY = ['/login', '/signup', '/forgot-password']

const matches = (path: string, prefixes: string[]) =>
  prefixes.some((p) => path === p || path.startsWith(p.endsWith('/') ? p : `${p}/`))

export async function middleware(request: NextRequest) {
  if (!isSupabaseEnabled()) return NextResponse.next()

  const { pathname, searchParams } = request.nextUrl

  // Lien d'e-mail redirigé vers l'URL du site (ex. « /?code=… ») : on le confie au callback.
  if (searchParams.has('code') && !pathname.startsWith('/auth/')) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/callback'
    return NextResponse.redirect(url)
  }

  const { response, user } = await updateSession(request)

  // Les redirections recopient les cookies de session rafraîchis.
  const redirect = (path: string, next?: string) => {
    const url = request.nextUrl.clone()
    url.pathname = path
    url.search = next ? `?next=${encodeURIComponent(next)}` : ''
    const res = NextResponse.redirect(url)
    for (const c of response().cookies.getAll()) res.cookies.set(c)
    return res
  }

  if (!user && !matches(pathname, PUBLIC_PREFIXES)) {
    return redirect('/login', pathname === '/' ? undefined : pathname + request.nextUrl.search)
  }
  if (user && matches(pathname, GUEST_ONLY)) return redirect('/dashboard')

  return response()
}

export const config = {
  // Tout sauf les fichiers statiques et les images
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)'],
}
