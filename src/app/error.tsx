'use client'

import { useEffect } from 'react'
import { DatabaseUnavailable } from '@/components/database-unavailable'
import { kindFromDigest } from '@/lib/db-error'

/**
 * App-level error boundary — one boundary for every route under `/`, rather
 * than a copy per page.
 *
 * In production Next replaces the server error's message with a digest before
 * it reaches this component, so the cause cannot be read from `error.message`
 * here. `DatabaseUnavailableError` therefore encodes its kind into the digest
 * server-side, which Next propagates verbatim; see src/lib/db-error.ts.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Still surface it in the browser console for whoever is debugging.
    console.error('Route error', error.digest ?? '', error)
  }, [error])

  const kind = kindFromDigest(error.digest)

  if (kind) {
    return (
      <DatabaseUnavailable kind={kind} digest={error.digest} reset={reset} />
    )
  }

  return (
    <main className="flex-1 px-5 py-10 max-w-md mx-auto w-full">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          KHURANA <span className="font-normal">ELECTRONICS</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500">Job Sheet Portal</p>
      </header>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">
          Something went wrong on this screen.
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          The page could not be loaded. Nothing you entered has been lost — try
          again, and if it keeps happening, report the reference below.
        </p>

        <button
          type="button"
          onClick={reset}
          className="mt-5 w-full rounded-lg bg-blue-800 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-900 active:bg-blue-900"
        >
          Try again
        </button>
      </div>

      <p className="mt-8 text-center text-xs text-slate-400">
        Khurana Electronics &middot; 0130-4018060
        {error.digest ? (
          <>
            <br />
            <span className="font-mono">Reference: {error.digest}</span>
          </>
        ) : null}
      </p>
    </main>
  )
}
