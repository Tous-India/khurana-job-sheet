import { prisma } from '@/lib/prisma'
import { AdminShell, EmptyState } from '@/components/admin-shell'
import { saveEngineer, toggleEngineer } from '@/app/admin/actions'

export const dynamic = 'force-dynamic'

export default async function EngineersAdminPage() {
  const engineers = await prisma.engineer.findMany({
    orderBy: [{ active: 'desc' }, { name: 'asc' }],
    include: { _count: { select: { jobSheets: true } } },
  })

  return (
    <AdminShell active="/admin/engineers">
      <form
        action={saveEngineer}
        className="mb-6 flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-white p-4"
      >
        <label className="min-w-[180px] flex-1">
          <span className="mb-1 block text-[11px] uppercase tracking-wide text-slate-500">
            Name
          </span>
          <input
            name="name"
            required
            placeholder="Engineer name"
            className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500"
          />
        </label>
        <label className="min-w-[140px]">
          <span className="mb-1 block text-[11px] uppercase tracking-wide text-slate-500">
            Phone
          </span>
          <input
            name="phone"
            inputMode="numeric"
            placeholder="Optional"
            className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500"
          />
        </label>
        <button
          type="submit"
          className="h-11 rounded-lg bg-blue-800 px-5 text-sm font-semibold text-white active:bg-blue-900"
        >
          Add engineer
        </button>
      </form>

      {engineers.length === 0 ? (
        <EmptyState>No engineers yet. Add the first one above.</EmptyState>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {engineers.map((e) => (
            <li key={e.id} className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-sm font-medium ${
                    e.active ? 'text-slate-900' : 'text-slate-400 line-through'
                  }`}
                >
                  {e.name}
                </p>
                <p className="text-xs text-slate-500">
                  {e.phone ?? 'No phone'} · {e._count.jobSheets} sheet
                  {e._count.jobSheets === 1 ? '' : 's'}
                </p>
              </div>
              <form action={toggleEngineer}>
                <input type="hidden" name="id" value={e.id} />
                <button
                  type="submit"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 active:bg-slate-50"
                >
                  {e.active ? 'Deactivate' : 'Reactivate'}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-xs text-slate-500">
        Engineers are deactivated rather than deleted, so past job sheets keep
        their author.
      </p>
    </AdminShell>
  )
}
