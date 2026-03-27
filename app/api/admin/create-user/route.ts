import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

// Service role client — bypasses RLS and email confirmation
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: NextRequest) {
  try {
    // Verify the requester is an admin
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })
    }

    // Get body
    const body = await request.json()
    const { full_name, email, phone, password, role } = body

    if (!full_name || !email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create auth user — email_confirm: true skips confirmation email
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,   // ← no confirmation email sent
      user_metadata: { full_name, phone, role },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Update profile with correct role & phone
    // (trigger creates profile with role='user' by default)
    if (authData.user) {
      const { error: profileError } = await adminSupabase
        .from('profiles')
        .update({ full_name, phone: phone || '', role })
        .eq('id', authData.user.id)

      if (profileError) {
        // User was created but profile update failed — still return success
        console.error('Profile update error:', profileError.message)
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name,
        role,
      },
    })
  } catch (err: any) {
    console.error('Create user error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}