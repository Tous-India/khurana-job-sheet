import { existsSync } from 'node:fs'
import path from 'node:path'
import Link from 'next/link'
import { findLatestJobSheet } from '@/lib/db'
import { withDbErrors } from '@/lib/db-error'
import { ComparisonView } from '@/components/comparison-view'

export const dynamic = 'force-dynamic'

/**
 * The strongest moment in the pitch (README 10): the handwritten sheet beside
 * the generated PDF for the same job. It makes the problem and the solution
 * visible at once, without anyone having to explain either.
 */
export default async function ComparisonPage() {
  // Prefer a sheet with Hindi content — it shows the hardest case working.
  const job = await withDbErrors(
    async () =>
      (await findLatestJobSheet('कैमरे')) ?? (await findLatestJobSheet()),
  )

  const realSheet = path.join(process.cwd(), 'public', 'demo', 'original-sheet.jpg')
  const originalSrc = existsSync(realSheet)
    ? '/demo/original-sheet.jpg'
    : '/demo/original-sheet-placeholder.png'
  const isPlaceholder = !existsSync(realSheet)

  if (!job) {
    return (
      <main className="flex-1 p-6 text-center">
        <p className="text-sm text-slate-500">
          No job sheets yet — create one first.
        </p>
        <Link href="/jobs" className="mt-4 inline-block text-sm text-blue-800">
          Back to job sheets
        </Link>
      </main>
    )
  }

  return (
    <main className="flex-1 pb-10">
      <header className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <Link
            href="/jobs"
            className="-ml-2 flex h-11 w-11 items-center justify-center rounded-lg text-slate-500 active:bg-slate-100"
            aria-label="Back"
          >
            &larr;
          </Link>
          <div className="min-w-0">
            <h1 className="text-base font-bold tracking-tight">Before &amp; after</h1>
            <p className="truncate text-xs text-slate-500">
              Same job, same information — {job.jobNo}
            </p>
          </div>
        </div>
      </header>

      <ComparisonView
        originalSrc={originalSrc}
        pdfSrc={`/job/${job.shareToken}/pdf`}
        isPlaceholder={isPlaceholder}
        jobNo={job.jobNo}
      />
    </main>
  )
}
