import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { isSupabaseConfigured } from '@/lib/supabase/config'

// Next.js 16: "middleware" is now "proxy" (same functionality).
// Optimistic auth gate only — real role checks live in layouts/pages.
//
//  - Supabase not configured yet → let everything through (demo mode).
//  - Not signed in + on a protected route → bounce to /login.
//  - Signed in + on /login or /signup → bounce to the app root (which
//    routes by role).

const PUBLIC_PREFIXES = ['/login', '/signup', '/auth', '/studio', '/api/ai']

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

export async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next()
  }

  const { user, supabaseResponse } = await updateSession(request)
  const { pathname } = request.nextUrl

  // Signed-in users shouldn't sit on the auth screens.
  if (user && (pathname === '/login' || pathname === '/signup')) {
    return redirectWithCookies(request, '/', supabaseResponse)
  }

  // Unauthenticated access to a protected route → login.
  if (!user && !isPublic(pathname)) {
    return redirectWithCookies(request, '/login', supabaseResponse)
  }

  return supabaseResponse
}

function redirectWithCookies(
  request: NextRequest,
  pathname: string,
  carrying: NextResponse
) {
  const url = request.nextUrl.clone()
  url.pathname = pathname
  url.search = ''
  const redirect = NextResponse.redirect(url)
  // Preserve any refreshed auth cookies on the redirect.
  carrying.cookies.getAll().forEach((c) => redirect.cookies.set(c))
  return redirect
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
