/**
 * Server-side classification of database failures.
 *
 * Next.js strips error messages in production before they reach a client
 * `error.tsx` — the boundary receives only a `digest`, which is why an
 * unconfigured deployment shows a bare error page with no clue as to the cause.
 * So the classification has to happen here, on the server, while the driver's
 * error is still intact; the boundary is then handed a symbolic `kind` that is
 * safe to render.
 *
 * Nothing derived from the connection string — host, port, database name, user
 * — is ever propagated. This matters concretely: MongoServerSelectionError puts
 * the resolved hostname in its message ("getaddrinfo ENOTFOUND <host>"), which
 * is precisely what must not reach the browser.
 */

export type DbErrorKind =
  /** No DATABASE_URL at all — the deployment was never configured. */
  | 'unconfigured'
  /** Configured, but the server refused or could not be reached. */
  | 'unreachable'
  /** Reached the server, but the credentials were rejected. */
  | 'rejected'
  /** Connected fine, but the collections are empty — the seed never ran. */
  | 'not-migrated'
  /** Connected, but out of connections. */
  | 'exhausted'
  /** A database error we have no specific guidance for. */
  | 'unknown'

/**
 * Marker prefix for the error `digest`.
 *
 * Next strips error messages in production, but propagates a pre-set `digest`
 * to the client boundary untouched. That makes the digest the one supported
 * channel for telling the boundary *why* the page failed. It carries only this
 * fixed prefix plus a `DbErrorKind` — a closed set of our own symbols, with
 * nothing derived from the connection string or the underlying error text.
 */
const DIGEST_PREFIX = 'DB_UNAVAILABLE:'

export class DatabaseUnavailableError extends Error {
  readonly kind: DbErrorKind
  readonly digest: string

  constructor(kind: DbErrorKind, cause?: unknown) {
    // The message is server-log-only; the browser sees `kind` via the digest.
    super(`Database unavailable (${kind})`)
    this.name = 'DatabaseUnavailableError'
    this.kind = kind
    this.digest = `${DIGEST_PREFIX}${kind}`
    this.cause = cause
  }
}

/** Recover the kind a server-side throw encoded into the digest, if any. */
export function kindFromDigest(digest: string | undefined): DbErrorKind | undefined {
  if (!digest?.startsWith(DIGEST_PREFIX)) return undefined
  const kind = digest.slice(DIGEST_PREFIX.length)
  return KINDS.includes(kind as DbErrorKind) ? (kind as DbErrorKind) : undefined
}

const KINDS: readonly DbErrorKind[] = [
  'unconfigured',
  'unreachable',
  'rejected',
  'not-migrated',
  'exhausted',
  'unknown',
]

function errorName(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) return undefined
  const name = (error as { name?: unknown }).name
  return typeof name === 'string' ? name : undefined
}

function errorCode(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) return undefined
  const code = (error as { code?: unknown }).code
  return typeof code === 'number' ? code : undefined
}

export function classifyDbError(error: unknown): DbErrorKind {
  if (error instanceof DatabaseUnavailableError) return error.kind

  // Authentication is a server error with a specific code, so it must be
  // checked before the name-based cases below.
  switch (errorCode(error)) {
    case 18: // AuthenticationFailed
    case 8000: // Atlas: "bad auth"
      return 'rejected'
    case 13: // Unauthorized — user lacks rights on this database
      return 'rejected'
  }

  switch (errorName(error)) {
    // Raised when the driver cannot reach any server in the topology: DNS
    // failure, connection refused, timeout, or an IP the Atlas allowlist
    // rejects. All have the same fix — make the server reachable.
    case 'MongoServerSelectionError':
    case 'MongoNetworkError':
    case 'MongoNetworkTimeoutError':
    case 'MongoTopologyClosedError':
      return 'unreachable'
    default:
      return 'unknown'
  }
}

/** True for errors that mean "the database layer is unusable", not "this query was wrong". */
export function isDbUnavailable(error: unknown): boolean {
  return classifyDbError(error) !== 'unknown'
}

/**
 * Run a server-side database read, converting infrastructure failures into a
 * `DatabaseUnavailableError` so the boundary can explain them.
 *
 * Only connection- and schema-level faults are translated. A genuine
 * application bug — a bad query, a missing required field — still propagates
 * untouched, because presenting that as "the database is down" would send
 * whoever is debugging in precisely the wrong direction.
 */
export async function withDbErrors<T>(query: () => Promise<T>): Promise<T> {
  try {
    return await query()
  } catch (error) {
    // A missing DATABASE_URL surfaces as a plain Error from src/lib/mongo.ts,
    // thrown before the driver is constructed, so it carries no driver code.
    if (
      error instanceof Error &&
      error.message.includes('DATABASE_URL is required')
    ) {
      throw new DatabaseUnavailableError('unconfigured', error)
    }

    const kind = classifyDbError(error)
    if (kind !== 'unknown') {
      throw new DatabaseUnavailableError(kind, error)
    }

    throw error
  }
}
