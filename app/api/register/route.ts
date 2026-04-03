import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logError, logInfo } from '@/lib/errorLogger'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { full_name, email, phone, password } = body

    if (!full_name || !email || !password) {
      return NextResponse.json(
        { error: 'Full name, email, and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const { data: { users } } = await adminSupabase.auth.admin.listUsers()
    const existingUser = users?.find(u => u.email === email)

    if (existingUser) {
      return NextResponse.json(
        { error: 'This email is already registered. Please sign in.' },
        { status: 400 }
      )
    }

    const { data: authData, error: authError } =
      await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: false,
        user_metadata: { full_name, phone: phone || '', role: 'user' },
      })

    if (authError) {
      await logError({
        message: authError.message,
        error: authError,
        route: '/api/register',
        action: 'create_auth_user',
        userEmail: email,
      })
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (authData.user) {
      await adminSupabase
        .from('profiles')
        .update({ full_name, phone: phone || '', role: 'user' })
        .eq('id', authData.user.id)

      const { error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
      })

      if (inviteError) {
        await logError({
          message: inviteError.message,
          error: inviteError,
          route: '/api/register',
          action: 'send_invite_email',
          userEmail: email,
          userId: authData.user.id,
          severity: 'warning',
        })
      } else {
        await logInfo('New user registered successfully', {
          route: '/api/register',
          action: 'register_user',
          userEmail: email,
          userId: authData.user.id,
        })
      }
    }

    return NextResponse.json({ success: true })

  } catch (err: any) {
    await logError({
      message: err?.message || 'Register API error',
      error: err,
      route: '/api/register',
      action: 'post_register',
    })
    return NextResponse.json(
      { error: 'Server error. Please try again.' },
      { status: 500 }
    )
  }
}
