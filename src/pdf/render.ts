import path from 'node:path'
import { readFile } from 'node:fs/promises'
import QRCode from 'qrcode'
import type { PdfAssets } from './job-sheet-document'

/**
 * Letterhead artwork is loaded as image assets rather than reconstructed with
 * renderer primitives (README 6.2). These are placeholders until the client
 * supplies the print-ready originals from their printer.
 */
async function localImageDataUrl(relPath: string): Promise<string> {
  const buf = await readFile(path.join(process.cwd(), 'public', relPath))
  return `data:image/png;base64,${buf.toString('base64')}`
}

let cachedAssets: PdfAssets | null = null

export async function loadPdfAssets(): Promise<PdfAssets> {
  if (cachedAssets) return cachedAssets

  const [headerImage, footerImage] = await Promise.all([
    localImageDataUrl('demo/letterhead-header.png'),
    localImageDataUrl('demo/letterhead-footer.png'),
  ])

  // CLIENT TO SUPPLY the review URL; without it the QR block is simply omitted.
  const reviewUrl = process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL
  const qrDataUrl = reviewUrl
    ? await QRCode.toDataURL(reviewUrl, { margin: 0, width: 160 })
    : null

  cachedAssets = { headerImage, footerImage, qrDataUrl }
  return cachedAssets
}

/**
 * Photos are stored as URLs. Local/relative ones must be inlined, since the
 * PDF renderer runs server-side with no browser origin to resolve them.
 */
export async function resolvePhotoSrc(url: string): Promise<string> {
  if (url.startsWith('data:')) return url
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  const clean = url.replace(/^\//, '')
  const buf = await readFile(path.join(process.cwd(), 'public', clean))
  const ext = path.extname(clean).toLowerCase()
  const mime = ext === '.png' ? 'image/png' : 'image/jpeg'
  return `data:${mime};base64,${buf.toString('base64')}`
}
