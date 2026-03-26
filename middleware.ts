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

  // Helper: redirect while carrying over refreshed session cookies
  function redirectWithCookies(url: string) {
    const redirectResponse = NextResponse.redirect(new URL(url, request.url))
    supabaseResponse.cookies.getAll().forEach(cookie => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    })
    return redirectResponse
  }

  // Public routes
  const publicRoutes = ['/', '/login', '/register', '/auth/callback']
  const isPublic = publicRoutes.some(r => pathname === r || pathname.startsWith('/api/'))

  if (!user && !isPublic) {
    return redirectWithCookies('/login')
  }

  if (user) {
    // Use maybeSingle() to avoid 500 errors; if profile fetch fails, fall through
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    // If profile query errors (e.g. RLS/network), allow request through
    // so the page itself can handle it rather than causing a redirect loop
    if (profileError) {
      console.error('[middleware] profile fetch error:', profileError.message)
      return supabaseResponse
    }

    const role = profile?.role ?? 'user'

    // Redirect logged-in users away from auth pages
    if (pathname === '/login' || pathname === '/register') {
      if (role === 'admin') return redirectWithCookies('/admin')
      if (role === 'security') return redirectWithCookies('/security')
      return redirectWithCookies('/dashboard')
    }

    // Protect admin routes
    if (pathname.startsWith('/admin') && role !== 'admin') {
      return redirectWithCookies('/dashboard')
    }

    // Protect security routes
    if (pathname.startsWith('/security') && role !== 'security' && role !== 'admin') {
      return redirectWithCookies('/dashboard')
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}