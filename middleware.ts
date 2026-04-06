import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  function redirectWithCookies(url: string) {
    const redirectResponse = NextResponse.redirect(new URL(url, request.url))
    supabaseResponse.cookies.getAll().forEach(cookie => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    })
    return redirectResponse
  }

  const publicRoutes = ['/', '/login', '/register', '/auth/callback', '/forgot-password', '/reset-password']
  const isPublic = publicRoutes.some(r => pathname === r || pathname.startsWith('/api/'))

  // Not logged in → send to login
  if (!user && !isPublic) {
    return redirectWithCookies('/login')
  }

  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('[middleware] profile fetch error:', profileError.message, {
        userId: user.id,
        pathname,
      })
      return supabaseResponse
    }

    const role = profile?.role ?? 'user'

    // Already logged in → redirect away from auth pages to their home
    if (pathname === '/login' || pathname === '/register') {
      if (role === 'admin') return redirectWithCookies('/admin')
      if (role === 'security') return redirectWithCookies('/security')
      return redirectWithCookies('/dashboard')
    }

    // ── ADMIN routes: admin only ──────────────────────────────
    if (pathname.startsWith('/admin')) {
      if (role !== 'admin') {
        if (role === 'security') return redirectWithCookies('/security')
        return redirectWithCookies('/dashboard')
      }
    }

    // ── SECURITY routes: security + admin only ────────────────
    if (pathname.startsWith('/security')) {
      if (role !== 'security' && role !== 'admin') {
        return redirectWithCookies('/dashboard')
      }
    }

    // ── USER routes: regular users only ──────────────────────
    // Security and admin should not be browsing user pages
    const userOnlyPrefixes = [
      '/dashboard',
      '/lost-items',
      '/found-items',
      '/claims',
      '/notifications',
      '/settings',
    ]
    const isUserRoute = userOnlyPrefixes.some(p => pathname.startsWith(p))

    if (isUserRoute && (role === 'security' || role === 'admin')) {
      if (role === 'security') return redirectWithCookies('/security')
      if (role === 'admin') return redirectWithCookies('/admin')
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}