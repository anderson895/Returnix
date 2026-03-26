import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)

    // Get the logged-in user
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Fetch role from profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const role = profile?.role

      // Redirect based on role
      if (role === 'admin') return NextResponse.redirect(`${origin}/admin`)
      if (role === 'security') return NextResponse.redirect(`${origin}/security`)
    }
  }

  // Default redirect for regular users
  return NextResponse.redirect(`${origin}/dashboard`)
}