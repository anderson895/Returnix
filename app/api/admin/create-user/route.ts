import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { logError, logInfo } from '@/lib/errorLogger'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      await logError({
        message: 'Unauthorized access to create-user',
        route: '/api/admin/create-user',
        action: 'auth_check',
        severity: 'warning',
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      await logError({
        message: 'Non-admin attempted to create user',
        route: '/api/admin/create-user',
        action: 'role_check',
        userId: user.id,
        userEmail: user.email,
        userRole: profile?.role,
        severity: 'warning',
      })
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })
    }

    const body = await request.json()
    const { full_name, email, phone, password, role } = body

    if (!full_name || !email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, phone, role },
    })

    if (authError) {
      await logError({
        message: authError.message,
        error: authError,
        route: '/api/admin/create-user',
        action: 'create_auth_user',
        userId: user.id,
        userEmail: user.email,
        userRole: 'admin',
        metadata: { target_email: email, target_role: role },
      })
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (authData.user) {
      const { error: profileError } = await adminSupabase
        .from('profiles')
        .update({ full_name, phone: phone || '', role })
        .eq('id', authData.user.id)

      if (profileError) {
        await logError({
          message: profileError.message,
          error: profileError,
          route: '/api/admin/create-user',
          action: 'update_profile',
          userId: user.id,
          userRole: 'admin',
          severity: 'warning',
          metadata: { new_user_id: authData.user.id },
        })
      } else {
        await logInfo('Admin created new user', {
          route: '/api/admin/create-user',
          action: 'create_user',
          userId: user.id,
          userEmail: user.email,
          userRole: 'admin',
          metadata: { new_user_email: email, new_user_role: role },
        })
      }
    }

    return NextResponse.json({
      success: true,
      user: { id: authData.user.id, email: authData.user.email, full_name, role },
    })

  } catch (err: any) {
    await logError({
      message: err?.message || 'Internal server error',
      error: err,
      route: '/api/admin/create-user',
      action: 'post_create_user',
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
