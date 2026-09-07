'use client'

/**
 * Last-resort boundary, for failures in the root layout itself — those happen
 * outside `error.tsx`, which renders inside the layout it would need to replace.
 *
 * This one substitutes for the whole document, so it must supply <html>/<body>
 * itself and cannot rely on the app's fonts or global stylesheet being present.
 * Styles are therefore inline, and the markup stays deliberately minimal.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          background: '#f8fafc',
          color: '#0f172a',
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        }}
      >
        <main style={{ maxWidth: '28rem', width: '100%', textAlign: 'center' }}>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              letterSpacing: '-0.01em',
              margin: 0,
            }}
          >
            KHURANA <span style={{ fontWeight: 400 }}>ELECTRONICS</span>
          </h1>
          <p style={{ margin: '0.25rem 0 2rem', fontSize: '0.875rem', color: '#64748b' }}>
            Job Sheet Portal
          </p>

          <div
            style={{
              border: '1px solid #e2e8f0',
              background: '#fff',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              textAlign: 'left',
            }}
          >
            <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
              The job sheet portal is temporarily unavailable.
            </h2>
            <p
              style={{
                margin: '0.5rem 0 0',
                fontSize: '0.875rem',
                lineHeight: 1.6,
                color: '#475569',
              }}
            >
              The application could not start. This has been recorded in the
              server logs.
            </p>

            <button
              type="button"
              onClick={reset}
              style={{
                marginTop: '1.25rem',
                width: '100%',
                border: 0,
                borderRadius: '0.5rem',
                background: '#1e40af',
                color: '#fff',
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>

          <p style={{ marginTop: '2rem', fontSize: '0.75rem', color: '#94a3b8' }}>
            Khurana Electronics &middot; 0130-4018060
            {error.digest ? (
              <>
                <br />
                <span style={{ fontFamily: 'ui-monospace, monospace' }}>
                  Reference: {error.digest}
                </span>
              </>
            ) : null}
          </p>
        </main>
      </body>
    </html>
  )
}
