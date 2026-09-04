import { NextResponse } from 'next/server'
import { uploadFile } from '@/lib/upload'

const MAX_BYTES = 8 * 1024 * 1024 // Photos are compressed client-side first.

export async function POST(request: Request) {
  try {
    const form = await request.formData()
    const file = form.get('file')

    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: 'file required' }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'file too large' }, { status: 413 })
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'images only' }, { status: 415 })
    }

    const name = form.get('filename')
    const result = await uploadFile(
      file,
      typeof name === 'string' && name ? name : 'photo.jpg',
    )
    return NextResponse.json(result)
  } catch (error) {
    console.error('upload failed', error)
    return NextResponse.json({ error: 'upload_failed' }, { status: 500 })
  }
}
