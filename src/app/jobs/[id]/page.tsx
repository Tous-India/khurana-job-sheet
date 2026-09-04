import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'

// Minimal detail view. PDF preview and sharing arrive in Phases 5-6 (README 13).
export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const job = await prisma.jobSheet.findUnique({
    where: { id },
    include: {
      engineer: { select: { name: true } },
      lineItems: { orderBy: { sortOrder: 'asc' } },
      faultyItems: { orderBy: { sortOrder: 'asc' } },
    },
  })

  if (!job) notFound()

  return (
    <main className="flex-1 px-5 py-6 max-w-md mx-auto w-full">
      <Link href="/jobs" className="text-sm text-blue-800">
        &larr; Job sheets
      </Link>

      <h1 className="mt-4 font-mono text-sm font-semibold text-blue-800">
        {job.jobNo}
      </h1>
      <p className="mt-1 text-lg font-semibold">{job.siteFirmName}</p>
      <p className="text-sm text-slate-500">
        {job.contactPerson} &middot; {job.mobileNo}
      </p>
      <p className="mt-1 text-sm text-slate-500">{job.address}</p>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-xs text-slate-500">Engineer</dt>
          <dd>{job.engineer.name}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Date</dt>
          <dd>{job.date.toLocaleDateString('en-IN')}</dd>
        </div>
      </dl>

      {job.lineItems.length > 0 && (
        <section className="mt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Products / Description
          </h2>
          <ul className="mt-2 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
            {job.lineItems.map((li) => (
              <li key={li.id} className="p-3 text-sm">
                <p className="font-medium">{li.description}</p>
                <p className="text-xs text-slate-500">
                  {li.modelNo ?? '—'} &middot; Qty {li.qty} &middot; Return{' '}
                  {li.returnMat} &middot; Consumed {li.consumedMat}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {job.faultyItems.length > 0 && (
        <section className="mt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Faulty material from client
          </h2>
          <ul className="mt-2 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
            {job.faultyItems.map((fi) => (
              <li key={fi.id} className="p-3 text-sm">
                <p>{fi.description}</p>
                <p className="text-xs text-slate-500">Qty {fi.qty}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {job.remarks && (
        <section className="mt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Remarks
          </h2>
          <p className="mt-2 rounded-lg border border-slate-200 bg-white p-3 text-sm">
            {job.remarks}
          </p>
        </section>
      )}

      <p className="mt-8 rounded-lg bg-slate-100 p-3 text-xs text-slate-500">
        PDF generation and WhatsApp sharing are built in Phases 5–6.
      </p>
    </main>
  )
}
