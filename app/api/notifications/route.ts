import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceClient()
    const body = await request.json()
    const { user_id, title, message, type, related_item_id, related_type } = body

    const { error } = await supabase.from('notifications').insert({
      user_id, title, message, type, related_item_id, related_type,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}
