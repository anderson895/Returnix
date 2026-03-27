import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Admin client — bypasses client-side rate limits
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

    // Check if email already exists in profiles
    const { data: existing } = await adminSupabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'This email is already registered. Please sign in.' },
        { status: 400 }
      )
    }

    // Create user — email_confirm: false sends the confirmation email
    // Using admin API bypasses the 2 email/hour rate limit
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
      if (
        authError.message.toLowerCase().includes('already been registered') ||
        authError.message.toLowerCase().includes('already registered') ||
        authError.message.toLowerCase().includes('duplicate')
      ) {
        return NextResponse.json(
          { error: 'This email is already registered. Please sign in.' },
          { status: 400 }
        )
      }
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Update profile created by trigger with correct name/phone
    if (authData.user) {
      await adminSupabase
        .from('profiles')
        .update({ full_name, phone: phone || '', role: 'user' })
        .eq('id', authData.user.id)
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