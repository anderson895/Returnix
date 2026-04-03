import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadImage } from '@/lib/cloudinary'
import { logError } from '@/lib/errorLogger'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      await logError({
        message: 'Unauthorized upload attempt',
        route: '/api/upload',
        action: 'auth_check',
        severity: 'warning',
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = (formData.get('folder') as string) || 'lost-found'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`

    const url = await uploadImage(base64, folder)
    return NextResponse.json({ url })

  } catch (err: any) {
    await logError({
      message: err?.message || 'Upload failed',
      error: err,
      route: '/api/upload',
      action: 'upload_image',
    })
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
