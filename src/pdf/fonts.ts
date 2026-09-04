import path from 'node:path'
import { Font } from '@react-pdf/renderer'

/**
 * CRITICAL (README 6.1). @react-pdf/renderer defaults to Helvetica, which has
 * no Devanagari glyphs — Hindi remarks would render as tofu. Hindi is a
 * headline feature, so this must be verified visually, never assumed.
 *
 * FONT CHOICE — Mukta, not Noto Sans Devanagari:
 * fontkit 2.0.4 (bundled with @react-pdf/renderer 4.9) throws
 * "Cannot read properties of null (reading 'xCoordinate')" while shaping
 * certain Devanagari clusters in Noto Sans Devanagari — `रे` (U+0930 U+0947)
 * is one, so a common word like "कैमरे" (cameras) crashes PDF generation
 * outright. Plain Noto Sans is worse: it does not throw, it silently renders
 * Devanagari codepoints as overlapping Latin glyphs, which looks like garbage
 * but passes any check that only asks whether rendering succeeded.
 *
 * Mukta (SIL OFL) shapes every string we ship, in both weights, and covers
 * Latin too — so one family serves the whole document.
 *
 * Files are committed under /public/fonts and read from disk, never a CDN: a
 * network failure at render time would silently reintroduce the tofu bug, and
 * the demo may run on venue wifi.
 */

let registered = false

export const FONT_FAMILY = 'Mukta'

export function registerPdfFonts(): void {
  if (registered) return
  const dir = path.join(process.cwd(), 'public', 'fonts')

  Font.register({
    family: FONT_FAMILY,
    fonts: [
      { src: path.join(dir, 'Mukta-Regular.ttf'), fontWeight: 'normal' },
      { src: path.join(dir, 'Mukta-Bold.ttf'), fontWeight: 'bold' },
    ],
  })

  // Devanagari words must not be broken mid-cluster.
  Font.registerHyphenationCallback((word) => [word])

  registered = true
}

/**
 * One family covers both scripts, so this always returns Mukta. Kept as the
 * single place every user-entered Text node routes through, so a future
 * script-specific font can be introduced in one edit.
 */
export function fontFor(_text: string | null | undefined): string {
  return FONT_FAMILY
}
