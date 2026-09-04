import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

/**
 * Single upload abstraction (README 5.10).
 *
 * Vercel Blob is the real path, including for the demo: Vercel's filesystem is
 * read-only at runtime, so writing to /public/uploads there fails exactly the
 * way SQLite would. Local disk is a dev convenience only, selected by the
 * absence of BLOB_READ_WRITE_TOKEN.
 */

export type UploadResult = { url: string; storage: 'blob' | 'local' }

export async function uploadFile(
  file: Blob,
  filename: string,
): Promise<UploadResult> {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  const key = `job-photos/${randomUUID()}-${safeName}`

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob')
    const { url } = await put(key, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })
    return { url, storage: 'blob' }
  }

  // Local development fallback.
  if (process.env.VERCEL) {
    throw new Error(
      'BLOB_READ_WRITE_TOKEN is required on Vercel — the filesystem is read-only.',
    )
  }

  const dir = path.join(process.cwd(), 'public', 'uploads')
  await mkdir(dir, { recursive: true })
  const localName = key.replace('job-photos/', '')
  await writeFile(
    path.join(dir, localName),
    Buffer.from(await file.arrayBuffer()),
  )
  return { url: `/uploads/${localName}`, storage: 'local' }
}
