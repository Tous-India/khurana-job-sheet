import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { withDbErrors } from '@/lib/db-error'
import { EngineerBadge } from '@/components/engineer-badge'
import { JobSearch } from '@/components/job-search'

export const dynamic = 'force-dynamic'

type SearchParams = { tab?: string; q?: string }

function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { tab, q } = await searchParams
  const showToday = tab !== 'all'
  const query = (q ?? '').trim()

  const jobs = await withDbErrors(() =>
    prisma.jobSheet.findMany({
      where: {
        ...(showToday ? { date: { gte: startOfToday() } } : {}),
        // Search by job number or client/site name — the two things the office
        // has to hand when a customer rings up about a visit.
        ...(query
          ? {
              OR: [
                { jobNo: { contains: query, mode: 'insensitive' as const } },
                { siteFirmName: { contains: query, mode: 'insensitive' as const } },
                { contactPerson: { contains: query, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      orderBy: { date: 'desc' },
      include: { engineer: { select: { name: true } } },
      take: 50,
    }),
  )

  return (
    <main className="flex-1 pb-24">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div>
            <h1 className="text-base font-bold tracking-tight">
              KHURANA <span className="font-normal">ELECTRONICS</span>
            </h1>
            <p className="text-xs text-slate-500">Job Sheets</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/demo/comparison"
              className="hidden rounded-lg border border-slate-300 px-2.5 py-2 text-[11px] font-medium text-slate-600 sm:block"
            >
              Before / after
            </Link>
            <Link
              href="/admin/engineers"
              className="rounded-lg border border-slate-300 px-2.5 py-2 text-[11px] font-medium text-slate-600"
            >
              Admin
            </Link>
            <EngineerBadge />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-md px-4">
        <nav className="mt-4 flex gap-1 rounded-lg bg-slate-200/70 p-1">
          {[
            { key: 'today', label: 'Today' },
            { key: 'all', label: 'All' },
          ].map((t) => {
            const active = showToday ? t.key === 'today' : t.key === 'all'
            return (
              <Link
                key={t.key}
                href={{ pathname: '/jobs', query: { tab: t.key, ...(query ? { q: query } : {}) } }}
                className={`tap-target flex flex-1 items-center justify-center rounded-md text-sm font-medium transition ${
                  active
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.label}
              </Link>
            )
          })}
        </nav>

        <div className="mt-3">
          <JobSearch initialQuery={query} tab={showToday ? 'today' : 'all'} />
        </div>

        {jobs.length === 0 ? (
          <p className="mt-10 rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            {query
              ? `No job sheets match "${query}".`
              : showToday
                ? 'No job sheets today yet.'
                : 'No job sheets yet.'}
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {jobs.map((job) => (
              <li key={job.id}>
                <Link
                  href={`/jobs/${job.id}`}
                  className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-400 hover:shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {job.siteFirmName}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {job.contactPerson} &middot; {job.mobileNo}
                      </p>
                    </div>
                    <span className="shrink-0 rounded bg-blue-50 px-2 py-1 font-mono text-[11px] font-medium text-blue-800">
                      {job.jobNo}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>{job.engineer.name}</span>
                    <time dateTime={job.date.toISOString()}>
                      {job.date.toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </time>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link
        href="/jobs/new"
        className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-md items-center justify-center gap-2 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur"
      >
        <span className="tap-target flex w-full items-center justify-center rounded-lg bg-blue-800 text-sm font-semibold text-white shadow-sm active:bg-blue-900">
          + New Job Sheet
        </span>
      </Link>
    </main>
  )
}
