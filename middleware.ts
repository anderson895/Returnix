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

  const publicRoutes = ['/', '/login', '/register', '/auth/callback']
  const isPublic = publicRoutes.some(r => pathname === r || pathname.startsWith('/api/'))

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
      // Log to console only — cannot use logError() here (middleware has no async DB access)
      console.error('[middleware] profile fetch error:', profileError.message, {
        userId: user.id,
        pathname,
      })
      return supabaseResponse
    }

    const role = profile?.role ?? 'user'

    if (pathname === '/login' || pathname === '/register') {
      if (role === 'admin') return redirectWithCookies('/admin')
      if (role === 'security') return redirectWithCookies('/security')
      return redirectWithCookies('/dashboard')
    }

    if (pathname.startsWith('/admin') && role !== 'admin') {
      return redirectWithCookies('/dashboard')
    }

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
