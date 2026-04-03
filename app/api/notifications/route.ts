import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { logError } from '@/lib/errorLogger'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceClient()
    const body = await request.json()
    const { user_id, title, message, type, related_item_id, related_type } = body

    const { error } = await supabase.from('notifications').insert({
      user_id, title, message, type, related_item_id, related_type,
    })

    if (error) {
      await logError({
        message: error.message,
        route: '/api/notifications',
        action: 'insert_notification',
        userId: user_id,
        metadata: { body },
      })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    await logError({
      message: err?.message || 'Failed to send notification',
      error: err,
      route: '/api/notifications',
      action: 'post_notification',
    })
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}
