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
  const ext = path.extname(relPath).toLowerCase()
  const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png'
  return `data:${mime};base64,${buf.toString('base64')}`
}

/**
 * Letterhead artwork, preferring the real assets cropped from Khurana's own
 * blank JOBSHEET template. Falls back to the generated placeholders so the PDF
 * always renders, even before those files are added.
 *
 * Drop header.png / footer.png into /public/letterhead and they are picked up
 * with no code change.
 */
async function letterheadOrPlaceholder(
  real: string,
  placeholder: string,
): Promise<string> {
  try {
    return await localImageDataUrl(real)
  } catch {
    return localImageDataUrl(placeholder)
  }
}

let cachedAssets: PdfAssets | null = null

export async function loadPdfAssets(): Promise<PdfAssets> {
  if (cachedAssets) return cachedAssets

  const [headerImage, footerImage] = await Promise.all([
    letterheadOrPlaceholder('letterhead/header.png', 'demo/letterhead-header.png'),
    letterheadOrPlaceholder('letterhead/footer.png', 'demo/letterhead-footer.png'),
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
