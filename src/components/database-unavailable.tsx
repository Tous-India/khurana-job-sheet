import type { DbErrorKind } from '@/lib/db-error'

/**
 * Shown instead of a blank screen when the database layer is unusable.
 *
 * This can end up in front of a client during a demo, so it reads as a
 * considered state rather than a crash: the brand header stays, the tone is
 * calm, and the engineer-facing line says only that the service is temporarily
 * unavailable. The specific cause is addressed to whoever can fix it, in
 * smaller type below — never a connection string, host or credential, and
 * never a raw digest as the only content on the page.
 */

type Copy = {
  /** What a field engineer needs to know. */
  headline: string
  /** What the person who can fix it needs to know. */
  detail: string
  /** The concrete next step, if there is an unambiguous one. */
  action?: string
}

const COPY: Record<DbErrorKind, Copy> = {
  unconfigured: {
    headline: 'The job sheet service is not finished being set up.',
    detail:
      'The application has no database configured, so no job sheets can be loaded or saved yet.',
    action: 'Set DATABASE_URL in the deployment environment, then redeploy.',
  },
  unreachable: {
    headline: 'The job sheet service cannot reach its database right now.',
    detail:
      'The database is configured but did not respond. This is usually a temporary outage, a paused database, or a network restriction.',
    action: 'Check that the database is running and reachable, then reload.',
  },
  rejected: {
    headline: 'The job sheet service was refused access to its database.',
    detail:
      'The database responded but rejected the connection — the credentials or database name in the deployment do not match.',
    action: 'Verify the database credentials in the deployment environment.',
  },
  'not-migrated': {
    headline: 'The job sheet service has no data tables yet.',
    detail:
      'The database connected successfully but is empty — the schema has never been created. This is a setup step, not a fault.',
    action: 'Run the database migrations against this database, then reload.',
  },
  exhausted: {
    headline: 'The job sheet service is temporarily overloaded.',
    detail:
      'The database refused new connections because too many are already open. Under serverless this usually means a direct connection string is being used where a pooled one is required.',
    action: 'Switch DATABASE_URL to the pooled connection string.',
  },
  unknown: {
    headline: 'The job sheet service is temporarily unavailable.',
    detail:
      'The database returned an unexpected error. The details have been recorded in the server logs.',
  },
}

export function DatabaseUnavailable({
  kind,
  digest,
  reset,
}: {
  kind: DbErrorKind
  digest?: string
  reset?: () => void
}) {
  const copy = COPY[kind] ?? COPY.unknown

  return (
    <main className="flex-1 px-5 py-10 max-w-md mx-auto w-full">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          KHURANA <span className="font-normal">ELECTRONICS</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500">Job Sheet Portal</p>
      </header>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600"
          >
            {/* Deliberately not a red error cross: this is a service state, not a
                failure the engineer standing at a site has done anything wrong. */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="h-5 w-5"
            >
              <path d="M12 8v5" />
              <path d="M12 16.5v.01" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </span>

          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {copy.headline}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {copy.detail}
            </p>
          </div>
        </div>

        {reset ? (
          <button
            type="button"
            onClick={reset}
            className="mt-5 w-full rounded-lg bg-blue-800 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-900 active:bg-blue-900"
          >
            Try again
          </button>
        ) : null}
      </div>

      {copy.action ? (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-100/70 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            To fix this
          </p>
          <p className="mt-1 text-sm text-slate-700">{copy.action}</p>
        </div>
      ) : null}

      <p className="mt-8 text-center text-xs text-slate-400">
        Khurana Electronics &middot; 0130-4018060
        {digest ? (
          <>
            <br />
            <span className="font-mono">Reference: {digest}</span>
          </>
        ) : null}
      </p>
    </main>
  )
}
