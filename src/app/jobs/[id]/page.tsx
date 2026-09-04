import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ShareActions } from '@/components/share-actions'

export const dynamic = 'force-dynamic'

export default async function JobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ created?: string }>
}) {
  const { id } = await params
  const { created } = await searchParams

  const job = await prisma.jobSheet.findUnique({
    where: { id },
    include: {
      engineer: { select: { name: true } },
      lineItems: { orderBy: { sortOrder: 'asc' } },
      faultyItems: { orderBy: { sortOrder: 'asc' } },
      photos: { orderBy: { takenAt: 'asc' } },
    },
  })

  if (!job) notFound()

  return (
    <main className="flex-1 pb-10">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <Link
            href="/jobs"
            className="-ml-2 flex h-11 w-11 items-center justify-center rounded-lg text-slate-500 active:bg-slate-100"
            aria-label="Back to job sheets"
          >
            &larr;
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-sm font-bold text-blue-800">
              {job.jobNo}
            </p>
            <p className="truncate text-xs text-slate-500">{job.siteFirmName}</p>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-md space-y-5 px-4 pt-4">
        <ShareActions
          shareToken={job.shareToken}
          jobNo={job.jobNo}
          mobileNo={job.mobileNo}
          contactPerson={job.contactPerson}
          dateIso={job.date.toISOString()}
          justCreated={created === '1'}
        />

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <dl className="grid grid-cols-2 gap-y-3 text-sm">
            <Row label="Contact" value={job.contactPerson} />
            <Row label="Mobile" value={job.mobileNo} />
            <Row label="Engineer" value={job.engineer.name} />
            <Row
              label="Date"
              value={job.date.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            />
          </dl>
          <div className="mt-3 border-t border-slate-100 pt-3">
            <dt className="text-[11px] uppercase tracking-wide text-slate-500">
              Site address
            </dt>
            <dd className="mt-0.5 text-sm">{job.address}</dd>
          </div>
          {job.locationAddress && (
            <div className="mt-3 border-t border-slate-100 pt-3">
              <dt className="text-[11px] uppercase tracking-wide text-slate-500">
                Location captured
              </dt>
              <dd className="mt-0.5 text-sm">{job.locationAddress}</dd>
            </div>
          )}
        </section>

        {job.lineItems.length > 0 && (
          <Section title="Products / description">
            {job.lineItems.map((li) => (
              <li key={li.id} className="p-3 text-sm">
                <p className="font-medium">{li.description}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {li.modelNo ? (
                    <span className="font-mono text-blue-700">{li.modelNo}</span>
                  ) : (
                    '—'
                  )}
                  {' · '}Qty {li.qty} · Return {li.returnMat} · Consumed{' '}
                  {li.consumedMat}
                </p>
              </li>
            ))}
          </Section>
        )}

        {job.faultyItems.length > 0 && (
          <Section title="Faulty material from client">
            {job.faultyItems.map((fi) => (
              <li key={fi.id} className="p-3 text-sm">
                <p>{fi.description}</p>
                <p className="mt-0.5 text-xs text-slate-500">Qty {fi.qty}</p>
              </li>
            ))}
          </Section>
        )}

        {job.photos.length > 0 && (
          <section>
            <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Site photos ({job.photos.length})
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {job.photos.map((p) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={p.id}
                  src={p.url}
                  alt={p.caption ?? 'Site photo'}
                  className="aspect-square w-full rounded-lg object-cover"
                />
              ))}
            </div>
          </section>
        )}

        {job.remarks && (
          <section>
            <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Remarks
            </h2>
            <p className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
              {job.remarks}
            </p>
          </section>
        )}

        {job.signatureData && (
          <section>
            <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Customer signature
            </h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={job.signatureData}
              alt="Customer signature"
              className="h-20 w-full rounded-xl border border-slate-200 bg-white object-contain p-2"
            />
          </section>
        )}
      </div>
    </main>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h2>
      <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
        {children}
      </ul>
    </section>
  )
}
