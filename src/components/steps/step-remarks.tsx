'use client'

import { useRef, useState } from 'react'
import type { JobDraft } from '@/lib/draft'

/**
 * Quick-chips drawn from the lines that recur across the real paper sheets
 * (README 5.5). Tapping beats typing, and Hindi chips remove the need to switch
 * keyboard language mid-sheet.
 */
const REMARK_CHIPS = [
  'Recording OK',
  'Date & Time set',
  'Camera focus adjusted',
  'HDD replaced',
  'Power supply checked',
  'कैमरा नया लगा दिया',
  'सभी कैमरे चेक कर दिए',
]

const MAX_PHOTOS = 5
const MIN_PHOTOS_SUGGESTED = 2

/** Longest edge after compression — keeps uploads small on a site connection. */
const MAX_EDGE = 1280
const JPEG_QUALITY = 0.7

async function compressImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY)
}

export function StepRemarks({
  draft,
  onChange,
}: {
  draft: JobDraft
  onChange: (patch: Partial<JobDraft>) => void
}) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)

  function appendChip(text: string) {
    const current = draft.remarks.trim()
    if (current.includes(text)) return
    onChange({ remarks: current ? `${current}. ${text}` : text })
  }

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return
    setBusy(true)
    setPhotoError(null)
    try {
      const room = MAX_PHOTOS - draft.photos.length
      const chosen = Array.from(files).slice(0, room)
      const compressed = await Promise.all(
        chosen.map(async (f) => ({
          dataUrl: await compressImage(f),
          caption: '',
        })),
      )
      onChange({ photos: [...draft.photos, ...compressed] })
    } catch {
      setPhotoError('Could not read that photo. Try again.')
    } finally {
      setBusy(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <span className="mb-1 block text-[11px] uppercase tracking-wide text-slate-500">
          Remarks <span className="normal-case text-slate-400">(optional)</span>
        </span>
        <textarea
          value={draft.remarks}
          onChange={(e) => onChange({ remarks: e.target.value })}
          rows={3}
          placeholder="हिंदी या English"
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {REMARK_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => appendChip(chip)}
              className="min-h-[36px] rounded-full border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 active:bg-blue-50"
            >
              + {chip}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-1 block text-[11px] uppercase tracking-wide text-slate-500">
          Site photos
          <span className="ml-1 normal-case text-slate-400">
            ({draft.photos.length}/{MAX_PHOTOS}
            {draft.photos.length < MIN_PHOTOS_SUGGESTED ? ', 2 recommended' : ''})
          </span>
        </span>

        <div className="grid grid-cols-3 gap-2">
          {draft.photos.map((p, i) => (
            <div key={i} className="relative aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.dataUrl}
                alt={`Site photo ${i + 1}`}
                className="h-full w-full rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={() =>
                  onChange({ photos: draft.photos.filter((_, x) => x !== i) })
                }
                aria-label={`Remove photo ${i + 1}`}
                className="absolute -right-1.5 -top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-sm text-white shadow"
              >
                &times;
              </button>
            </div>
          ))}

          {draft.photos.length < MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={busy}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 text-slate-500 active:bg-slate-50 disabled:opacity-50"
            >
              <span className="text-2xl leading-none">+</span>
              <span className="text-[10px] font-medium">
                {busy ? 'Working…' : 'Camera'}
              </span>
            </button>
          )}
        </div>

        {photoError && (
          <p className="mt-2 text-xs text-amber-800">{photoError}</p>
        )}

        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={(e) => void addPhotos(e.target.files)}
        />
      </div>

      <label className="block">
        <span className="mb-1 block text-[11px] uppercase tracking-wide text-slate-500">
          Client&rsquo;s other materials
          <span className="ml-1 normal-case text-slate-400">(optional)</span>
        </span>
        <textarea
          value={draft.clientOtherMaterials}
          onChange={(e) => onChange({ clientOtherMaterials: e.target.value })}
          rows={2}
          placeholder="Parts or materials left with the client"
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </label>
    </div>
  )
}
