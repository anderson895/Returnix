import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/errorLogger'

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const origin = requestUrl.origin

    if (code) {
      const supabase = await createClient()
      const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

      if (sessionError) {
        await logError({
          message: sessionError.message,
          error: sessionError,
          route: '/api/auth/callback',
          action: 'exchange_code_for_session',
        })
        return NextResponse.redirect(`${origin}/login`)
      }

      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profileError) {
          await logError({
            message: profileError.message,
            error: profileError,
            route: '/api/auth/callback',
            action: 'fetch_profile',
            userId: user.id,
            userEmail: user.email,
            severity: 'warning',
          })
        }

        const role = profile?.role
        if (role === 'admin') return NextResponse.redirect(`${origin}/admin`)
        if (role === 'security') return NextResponse.redirect(`${origin}/security`)
      }
    }

    return NextResponse.redirect(`${origin}/dashboard`)

  } catch (err: any) {
    await logError({
      message: err?.message || 'Auth callback error',
      error: err,
      route: '/api/auth/callback',
      action: 'get_callback',
    })
    return NextResponse.redirect('/login')
  }
}
