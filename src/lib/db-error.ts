/**
 * Server-side classification of database failures.
 *
 * Next.js strips error messages in production before they reach a client
 * `error.tsx` — the boundary receives only a `digest`, which is why an
 * unconfigured deployment shows a bare error page with no clue as to the cause.
 * So the classification has to happen here, on the server, while the Prisma
 * error code is still intact; the boundary is then handed a symbolic `kind`
 * that is safe to render.
 *
 * Codes are Prisma's own (see the driver-adapter error mapping in the client
 * runtime). Nothing derived from the connection string — host, port, database
 * name, user — is ever propagated: Prisma puts those in the error *message*,
 * which is precisely what must not reach the browser.
 */

export type DbErrorKind =
  /** No DATABASE_URL at all — the deployment was never configured. */
  | 'unconfigured'
  /** Configured, but the server refused or could not be reached. */
  | 'unreachable'
  /** Reached the server, but the credentials or database name are wrong. */
  | 'rejected'
  /** Connected fine, but the schema is empty — migrations never ran. */
  | 'not-migrated'
  /** Connected, but out of connections — the classic direct-vs-pooled mistake. */
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

function prismaCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) return undefined
  const code = (error as { code?: unknown }).code
  return typeof code === 'string' ? code : undefined
}

export function classifyDbError(error: unknown): DbErrorKind {
  if (error instanceof DatabaseUnavailableError) return error.kind

  switch (prismaCode(error)) {
    case 'P1000': // AuthenticationFailed
    case 'P1010': // DatabaseAccessDenied
      return 'rejected'
    case 'P1001': // DatabaseNotReachable
    case 'P1008': // SocketTimeout
    case 'P1011': // TlsConnectionError
    case 'P1017': // ConnectionClosed
      return 'unreachable'
    case 'P1003': // DatabaseDoesNotExist
      return 'rejected'
    case 'P2021': // TableDoesNotExist
    case 'P2022': // ColumnNotFound — schema drift, same fix as a missing table
      return 'not-migrated'
    case 'P2037': // TooManyConnections
      return 'exhausted'
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
    // A missing DATABASE_URL surfaces as a plain Error from src/lib/prisma.ts,
    // before Prisma is ever constructed, so it carries no Prisma code.
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
