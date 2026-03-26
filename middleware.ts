import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
        setAll(cookiesToSet) {
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

  // Public routes
  const publicRoutes = ['/', '/login', '/register', '/auth/callback']
  const isPublic = publicRoutes.some(r => pathname === r || pathname.startsWith('/api/'))

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If logged in, get profile for role-based protection
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role

    // Redirect logged-in users away from auth pages
    if (pathname === '/login' || pathname === '/register') {
      if (role === 'admin') return NextResponse.redirect(new URL('/admin', request.url))
      if (role === 'security') return NextResponse.redirect(new URL('/security', request.url))
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Protect admin routes
    if (pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Protect security routes
    if (pathname.startsWith('/security') && role !== 'security' && role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
