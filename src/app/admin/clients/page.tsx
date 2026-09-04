import { prisma } from '@/lib/prisma'
import { AdminShell, EmptyState } from '@/components/admin-shell'
import { deleteClient, saveClient } from '@/app/admin/actions'

export const dynamic = 'force-dynamic'

export default async function ClientsAdminPage() {
  const clients = await prisma.client.findMany({
    orderBy: { firmName: 'asc' },
    include: { _count: { select: { jobSheets: true } } },
  })

  return (
    <AdminShell active="/admin/clients">
      <form
        action={saveClient}
        className="mb-6 grid gap-2 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2"
      >
        <Input name="firmName" label="Firm name" required placeholder="Site / firm" />
        <Input name="contactPerson" label="Contact person" placeholder="Optional" />
        <Input name="phone" label="Phone" placeholder="10 digits" />
        <Input name="address" label="Address" placeholder="Site address" />
        <div className="sm:col-span-2">
          <button
            type="submit"
            className="h-11 rounded-lg bg-blue-800 px-5 text-sm font-semibold text-white active:bg-blue-900"
          >
            Add client
          </button>
        </div>
      </form>

      {clients.length === 0 ? (
        <EmptyState>No clients yet. Add one above, or they are created as engineers type new site names.</EmptyState>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {clients.map((c) => (
            <li key={c.id} className="flex items-start gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{c.firmName}</p>
                <p className="truncate text-xs text-slate-500">
                  {[c.contactPerson, c.phone].filter(Boolean).join(' · ') ||
                    'No contact'}
                </p>
                {c.address && (
                  <p className="truncate text-xs text-slate-400">{c.address}</p>
                )}
              </div>
              <span className="shrink-0 rounded bg-slate-100 px-2 py-1 text-[11px] text-slate-600">
                {c._count.jobSheets} sheet{c._count.jobSheets === 1 ? '' : 's'}
              </span>
              <form action={deleteClient}>
                <input type="hidden" name="id" value={c.id} />
                <button
                  type="submit"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-rose-700 active:bg-rose-50"
                >
                  Delete
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  )
}

function Input({
  name,
  label,
  required,
  placeholder,
}: {
  name: string
  label: string
  required?: boolean
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <input
        name={name}
        required={required}
        placeholder={placeholder}
        className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500"
      />
    </label>
  )
}
