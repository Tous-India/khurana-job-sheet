'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import type { JobDraft } from '@/lib/draft'

type GpsState = 'idle' | 'locating' | 'done' | 'denied' | 'unavailable'

/**
 * Step 5. Signature is the one hard gate (README 5.6). GPS captures silently in
 * the background so the engineer never waits on it, and falls back to raw
 * coordinates — then to manual entry — rather than blocking sign-off (5.7).
 */
export function StepSignOff({
  draft,
  onChange,
}: {
  draft: JobDraft
  onChange: (patch: Partial<JobDraft>) => void
}) {
  const padRef = useRef<SignatureCanvas | null>(null)
  const [gps, setGps] = useState<GpsState>('idle')
  const started = useRef(false)

  const captureLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setGps('unavailable')
      return
    }
    setGps('locating')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        onChange({ latitude, longitude })
        try {
          const res = await fetch(
            `/api/geocode?lat=${latitude}&lon=${longitude}`,
          )
          const data = (await res.json()) as { address: string | null }
          onChange({
            locationAddress:
              data.address ??
              `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
          })
        } catch {
          // Coordinates are the evidentiary part; the address is a convenience.
          onChange({
            locationAddress: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
          })
        }
        setGps('done')
      },
      () => setGps('denied'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }, [onChange])

  // Fire once on mount so the fix is usually ready before he finishes signing.
  useEffect(() => {
    if (started.current) return
    started.current = true
    if (draft.latitude == null) captureLocation()
    else setGps('done')
  }, [captureLocation, draft.latitude])

  // Restore a signature drawn before a reload.
  useEffect(() => {
    if (draft.signatureData && padRef.current?.isEmpty()) {
      padRef.current.fromDataURL(draft.signatureData)
    }
  }, [draft.signatureData])

  function commitSignature() {
    const pad = padRef.current
    if (!pad || pad.isEmpty()) return
    onChange({ signatureData: pad.toDataURL('image/png') })
  }

  function clearSignature() {
    padRef.current?.clear()
    onChange({ signatureData: null })
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wide text-slate-500">
            Customer signature <span className="text-rose-600">*</span>
          </span>
          {draft.signatureData && (
            <button
              type="button"
              onClick={clearSignature}
              className="text-xs font-medium text-blue-800 underline underline-offset-2"
            >
              Clear
            </button>
          )}
        </div>
        <div
          className={`overflow-hidden rounded-xl border-2 bg-white ${
            draft.signatureData ? 'border-blue-300' : 'border-dashed border-slate-300'
          }`}
        >
          <SignatureCanvas
            ref={(r) => {
              padRef.current = r
            }}
            penColor="#1e293b"
            canvasProps={{
              className: 'w-full h-[180px] touch-none',
            }}
            onEnd={commitSignature}
          />
        </div>
        <p className="mt-1 text-center text-[11px] text-slate-400">
          {draft.signatureData
            ? 'Signature captured'
            : 'Ask the customer to sign above'}
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <span className="text-[11px] uppercase tracking-wide text-slate-500">
          Location
        </span>
        {gps === 'locating' && (
          <p className="mt-1 text-sm text-slate-500">Getting location…</p>
        )}
        {gps === 'done' && (
          <p className="mt-1 text-sm text-slate-800">
            {draft.locationAddress ?? '—'}
          </p>
        )}
        {(gps === 'denied' || gps === 'unavailable') && (
          <>
            <input
              type="text"
              value={draft.locationAddress ?? ''}
              onChange={(e) => onChange({ locationAddress: e.target.value })}
              placeholder="Type the location"
              className="mt-1 h-[48px] w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500"
            />
            <button
              type="button"
              onClick={captureLocation}
              className="mt-2 text-xs font-medium text-blue-800 underline underline-offset-2"
            >
              Try GPS again
            </button>
          </>
        )}
      </div>

      <dl className="rounded-xl bg-slate-100 p-3 text-xs text-slate-600">
        <div className="flex justify-between py-0.5">
          <dt>Products</dt>
          <dd className="font-medium text-slate-800">
            {draft.lineItems.filter((li) => li.description.trim()).length}
          </dd>
        </div>
        <div className="flex justify-between py-0.5">
          <dt>Faulty items</dt>
          <dd className="font-medium text-slate-800">
            {draft.faultyItems.filter((fi) => fi.description.trim()).length}
          </dd>
        </div>
        <div className="flex justify-between py-0.5">
          <dt>Photos</dt>
          <dd className="font-medium text-slate-800">{draft.photos.length}</dd>
        </div>
      </dl>
    </div>
  )
}
