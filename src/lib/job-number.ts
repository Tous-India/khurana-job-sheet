import { prisma } from '@/lib/prisma'

/**
 * Job numbers are KE-YYYYMMDD-NNN with NNN a per-day sequence (README 5.1).
 *
 * The sequence is derived by counting that day's rows, so two engineers
 * submitting at the same moment would compute the same number. `jobNo` is
 * @unique, so the loser hits Prisma's P2002 unique-constraint error; we
 * recompute and retry rather than surfacing a failure to the engineer.
 */
const MAX_ATTEMPTS = 5

function formatJobNo(date: Date, seq: number): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `KE-${y}${m}${d}-${String(seq).padStart(3, '0')}`
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  )
}

/**
 * Runs `create` with a freshly computed job number, retrying on collision.
 * The caller supplies the create so the number and the row are written in one
 * shot — computing a number and returning it would leave a window for reuse.
 */
export async function createWithJobNumber<T>(
  date: Date,
  create: (jobNo: string) => Promise<T>,
): Promise<T> {
  const dayStart = new Date(date)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayEnd.getDate() + 1)

  let lastError: unknown

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const countToday = await prisma.jobSheet.count({
      where: { date: { gte: dayStart, lt: dayEnd } },
    })
    // On retry, step past the number that just collided.
    const jobNo = formatJobNo(date, countToday + 1 + attempt)

    try {
      return await create(jobNo)
    } catch (error) {
      if (!isUniqueViolation(error)) throw error
      lastError = error
    }
  }

  throw new Error(
    `Could not allocate a unique job number after ${MAX_ATTEMPTS} attempts.`,
    { cause: lastError },
  )
}
