import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { logError, logInfo } from '@/lib/errorLogger'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function PATCH(request: NextRequest) {
  try {
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
      await logError({
        message: 'Non-admin attempted to update user',
        route: '/api/admin/update-user',
        action: 'role_check',
        userId: user.id,
        userEmail: user.email,
        userRole: profile?.role,
        severity: 'warning',
      })
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })
    }

    const body = await request.json()
    const { id, full_name, phone, role } = body

    if (!id || !full_name || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { error: updateError } = await adminSupabase
      .from('profiles')
      .update({
        full_name,
        phone: phone || '',
        role,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      await logError({
        message: updateError.message,
        error: updateError,
        route: '/api/admin/update-user',
        action: 'update_profile',
        userId: user.id,
        userRole: 'admin',
        severity: 'warning',
        metadata: { target_user_id: id },
      })
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    await logInfo('Admin updated user', {
      route: '/api/admin/update-user',
      action: 'update_user',
      userId: user.id,
      userEmail: user.email,
      userRole: 'admin',
      metadata: { target_user_id: id, new_role: role },
    })

    return NextResponse.json({ success: true })

  } catch (err: any) {
    await logError({
      message: err?.message || 'Internal server error',
      error: err,
      route: '/api/admin/update-user',
      action: 'patch_update_user',
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}