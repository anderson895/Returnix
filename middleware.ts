import { createServerClient, type CookieOptions } from '@supabase/ssr'
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
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // 🔍 DEBUG — tanggalin pagkatapos ma-fix
  console.log('--- MIDDLEWARE ---')
  console.log('pathname:', pathname)
  console.log('user:', user?.id ?? 'NULL')
  console.log('error:', error?.message ?? 'none')
  console.log('cookies:', request.cookies.getAll().map(c => c.name))

  const isPublicPath =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon')

  function redirectTo(path: string) {
    console.log(`⟶ REDIRECTING to ${path}`) // 🔍 DEBUG
    const url = request.nextUrl.clone()
    url.pathname = path
    const res = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach(({ name, value, ...rest }) => {
      res.cookies.set(name, value, rest)
    })
    return res
  }

  if (!user && !isPublicPath) {
    return redirectTo('/login')
  }

  if (user && (pathname === '/login' || pathname === '/register')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role ?? 'user'
    console.log('role:', role) // 🔍 DEBUG

    if (role === 'admin') return redirectTo('/admin')
    if (role === 'security') return redirectTo('/security')
    return redirectTo('/dashboard')
  }

  if (user && (pathname.startsWith('/admin') || pathname.startsWith('/security'))) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role ?? 'user'

    if (pathname.startsWith('/admin') && role !== 'admin') {
      return redirectTo('/dashboard')
    }
    if (pathname.startsWith('/security') && role !== 'security' && role !== 'admin') {
      return redirectTo('/dashboard')
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}