import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logError } from '@/lib/errorLogger'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const { data: { users }, error: listError } =
      await adminSupabase.auth.admin.listUsers()

    if (listError) {
      await logError({
        message: listError.message,
        error: listError,
        route: '/api/resend-verification',
        action: 'list_users',
        userEmail: email,
      })
      return NextResponse.json({ error: listError.message }, { status: 500 })
    }

    const user = users.find(u => u.email === email)

    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email.' },
        { status: 404 }
      )
    }

    if (user.email_confirmed_at) {
      return NextResponse.json(
        { error: 'Email is already verified. Please sign in.' },
        { status: 400 }
      )
    }

    const { error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    })

    if (inviteError) {
      await logError({
        message: inviteError.message,
        error: inviteError,
        route: '/api/resend-verification',
        action: 'send_invite_email',
        userEmail: email,
        userId: user.id,
      })
      return NextResponse.json({ error: 'Failed to send email. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (err: any) {
    await logError({
      message: err?.message || 'Resend verification error',
      error: err,
      route: '/api/resend-verification',
      action: 'post_resend_verification',
    })
    return NextResponse.json(
      { error: 'Server error. Please try again.' },
      { status: 500 }
    )
  }
}
