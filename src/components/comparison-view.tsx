'use client'

import { useState } from 'react'

/**
 * Side by side on a desk, swipe-toggled on a phone — the pitch is given on
 * both. Stacking two full sheets vertically on a 390px screen would make each
 * illegible, so mobile gets a toggle instead.
 */
export function ComparisonView({
  originalSrc,
  pdfSrc,
  isPlaceholder,
  jobNo,
}: {
  originalSrc: string
  pdfSrc: string
  isPlaceholder: boolean
  jobNo: string
}) {
  const [side, setSide] = useState<'before' | 'after'>('before')

  return (
    <div className="mx-auto max-w-5xl px-4 pt-4">
      {/* Mobile toggle */}
      <div className="mb-3 flex gap-1 rounded-lg bg-slate-200/70 p-1 md:hidden">
        {(['before', 'after'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSide(s)}
            className={`flex h-11 flex-1 items-center justify-center rounded-md text-sm font-medium transition ${
              side === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            {s === 'before' ? 'Paper sheet' : 'Generated PDF'}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <figure className={side === 'before' ? '' : 'hidden md:block'}>
          <figcaption className="mb-2 flex items-center gap-2">
            <span className="rounded bg-rose-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-rose-800">
              Before
            </span>
            <span className="text-xs text-slate-500">Handwritten, on paper</span>
          </figcaption>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={originalSrc}
            alt="Original handwritten job sheet"
            className="w-full rounded-xl border border-slate-200 bg-white"
          />
          <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
            <Point tone="bad">Date, job no. and mobile left blank</Point>
            <Point tone="bad">Model numbers unreadable by the office</Point>
            <Point tone="bad">Return / consumed columns ambiguous</Point>
            <Point tone="bad">Customer gets a smudged carbon copy</Point>
          </ul>
        </figure>

        <figure className={side === 'after' ? '' : 'hidden md:block'}>
          <figcaption className="mb-2 flex items-center gap-2">
            <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
              After
            </span>
            <span className="text-xs text-slate-500">{jobNo}</span>
          </figcaption>
          <object
            data={`${pdfSrc}#toolbar=0&navpanes=0`}
            type="application/pdf"
            className="h-[520px] w-full rounded-xl border border-slate-200 bg-white"
            aria-label="Generated job sheet PDF"
          >
            <div className="p-6 text-center text-sm text-slate-500">
              <a href={pdfSrc} className="text-blue-800 underline">
                Open the generated PDF
              </a>
            </div>
          </object>
          <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
            <Point tone="good">Job no., date and engineer filled automatically</Point>
            <Point tone="good">Model numbers selected, never handwritten</Point>
            <Point tone="good">Quantities always recorded, never blank</Point>
            <Point tone="good">GPS-stamped, signed, sent on WhatsApp from site</Point>
          </ul>
        </figure>
      </div>

      {isPlaceholder && (
        <p className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-900">
          The &ldquo;before&rdquo; image is a placeholder. Drop a photo of a
          completed handwritten sheet at{' '}
          <code className="font-mono">public/demo/original-sheet.jpg</code> and
          it appears here automatically.
        </p>
      )}
    </div>
  )
}

function Point({
  tone,
  children,
}: {
  tone: 'good' | 'bad'
  children: React.ReactNode
}) {
  return (
    <li className="flex gap-2">
      <span
        aria-hidden
        className={tone === 'good' ? 'text-emerald-600' : 'text-rose-600'}
      >
        {tone === 'good' ? '✓' : '✕'}
      </span>
      <span>{children}</span>
    </li>
  )
}
