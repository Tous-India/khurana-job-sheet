import { NextResponse } from 'next/server'

/**
 * Reverse geocoding via OpenStreetMap Nominatim (README 5.7).
 *
 * Server-side because Nominatim's usage policy requires an identifying
 * User-Agent, which browsers refuse to let scripts set.
 */

const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const MIN_INTERVAL_MS = 1000 // Nominatim allows at most 1 request/second.
const REQUEST_TIMEOUT_MS = 5000

type CacheEntry = { address: string; at: number }
const cache = new Map<string, CacheEntry>()
let lastRequestAt = 0

/** ~11m of precision — repeat visits to one site reuse the cached lookup. */
function cacheKey(lat: number, lon: number): string {
  return `${lat.toFixed(4)},${lon.toFixed(4)}`
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = Number(searchParams.get('lat'))
  const lon = Number(searchParams.get('lon'))

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: 'lat and lon required' }, { status: 400 })
  }

  const key = cacheKey(lat, lon)
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return NextResponse.json({ address: hit.address, cached: true })
  }

  // Serialise callers to respect the rate limit.
  const wait = Math.max(0, lastRequestAt + MIN_INTERVAL_MS - Date.now())
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))
  lastRequestAt = Date.now()

  const contact =
    process.env.NOMINATIM_CONTACT_EMAIL ?? 'contact@khuranaelectronics.example'

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': `KhuranaElectronics-JobSheet/1.0 (${contact})`,
          'Accept-Language': 'en',
        },
        signal: controller.signal,
      },
    )
    clearTimeout(timer)

    if (!res.ok) throw new Error(`Nominatim responded ${res.status}`)

    const data = (await res.json()) as { display_name?: string }
    const address = data.display_name?.trim()
    if (!address) throw new Error('No display_name in response')

    cache.set(key, { address, at: Date.now() })
    return NextResponse.json({ address, cached: false })
  } catch (error) {
    // Never block sign-off on geocoding — the coordinates are the evidentiary
    // part, and the client falls back to displaying them raw.
    console.error('reverse geocode failed', error)
    return NextResponse.json(
      { address: null, error: 'lookup_failed' },
      { status: 200 },
    )
  }
}
