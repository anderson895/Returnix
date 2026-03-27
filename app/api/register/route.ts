import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Admin client — for user creation and profile updates
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

    // Check if email already exists
    const { data: { users } } = await adminSupabase.auth.admin.listUsers()
    const existingUser = users?.find(u => u.email === email)
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'This email is already registered. Please sign in.' },
        { status: 400 }
      )
    }

    // Create user first (without sending email)
    const { data: authData, error: authError } =
      await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: false,
        user_metadata: {
          full_name,
          phone: phone || '',
          role: 'user',
        },
      })

    if (authError) {
      console.error('Create user error:', authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Update profile
    if (authData.user) {
      await adminSupabase
        .from('profiles')
        .update({ full_name, phone: phone || '', role: 'user' })
        .eq('id', authData.user.id)

      // Now send the invite email (uses your custom SMTP)
      const { error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
      })

      if (inviteError) {
        console.error('Invite email error:', inviteError)
        // User created but email failed - don't fail the whole registration
        // They can use the resend button
      }
    }

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('Register API error:', err)
    return NextResponse.json(
      { error: 'Server error. Please try again.' },
      { status: 500 }
    )
  }
}