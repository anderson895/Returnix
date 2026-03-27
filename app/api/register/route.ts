import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Service role client — bypasses email confirmation
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

    // Create user — email_confirm: true = no confirmation email sent
    const { data: authData, error: authError } =
      await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name, phone: phone || '', role: 'user' },
      })

    if (authError) {
      // Handle duplicate email
      if (authError.message.toLowerCase().includes('already registered') ||
          authError.message.toLowerCase().includes('already been registered')) {
        return NextResponse.json(
          { error: 'This email is already registered. Please sign in.' },
          { status: 400 }
        )
      }
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Update profile (trigger creates it with defaults)
    if (authData.user) {
      await adminSupabase.from('profiles').update({
        full_name,
        phone: phone || '',
      }).eq('id', authData.user.id)
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Register error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}