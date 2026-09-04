'use client'

import { useState } from 'react'
import { whatsappHref } from '@/lib/share'

/**
 * The moment the sheet reaches the customer. WhatsApp is the primary action and
 * is sized accordingly — the engineer taps it while still standing at the site.
 */
export function ShareActions({
  shareToken,
  jobNo,
  mobileNo,
  contactPerson,
  dateIso,
  justCreated,
}: {
  shareToken: string
  jobNo: string
  mobileNo: string
  contactPerson: string
  dateIso: string
  justCreated: boolean
}) {
  const [copied, setCopied] = useState(false)
  // Built in the browser so the link works on whatever host the demo runs on
  // (localhost, LAN IP for phone testing, or the deployed URL).
  const pdfUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/job/${shareToken}/pdf`
      : ''

  const wa = whatsappHref({
    mobileNo,
    contactPerson,
    jobNo,
    date: new Date(dateIso),
    pdfUrl,
  })

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(pdfUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard is blocked on insecure origins; select-and-copy still works.
      window.prompt('Copy this link:', pdfUrl)
    }
  }

  return (
    <section className="space-y-2">
      {justCreated && (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-3 text-sm text-emerald-900">
          <span aria-hidden className="text-lg leading-none">✓</span>
          <span className="font-medium">Job sheet saved as {jobNo}</span>
        </div>
      )}

      <a
        href={wa}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-[56px] w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] text-base font-semibold text-white shadow-sm active:brightness-95"
      >
        Send on WhatsApp
      </a>

      <div className="flex gap-2">
        <a
          href={`/job/${shareToken}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-[52px] flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-800 active:bg-slate-50"
        >
          Open PDF
        </a>
        <button
          type="button"
          onClick={copyLink}
          className="flex h-[52px] flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-800 active:bg-slate-50"
        >
          {copied ? 'Link copied ✓' : 'Copy link'}
        </button>
      </div>
    </section>
  )
}
