import { prisma } from '@/lib/prisma'
import { AdminShell, EmptyState } from '@/components/admin-shell'
import { saveProduct, toggleProduct } from '@/app/admin/actions'

export const dynamic = 'force-dynamic'

export default async function ProductsAdminPage() {
  const products = await prisma.product.findMany({
    orderBy: [{ active: 'desc' }, { brand: 'asc' }, { name: 'asc' }],
  })

  return (
    <AdminShell active="/admin/products">
      <form
        action={saveProduct}
        className="mb-6 grid gap-2 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-4"
      >
        <Input name="name" label="Product" required placeholder="Dome Camera 2MP" />
        <Input name="modelNo" label="Model no." placeholder="DS-2CE5AD0T-IRP" />
        <Input name="brand" label="Brand" placeholder="Hikvision" />
        <Input name="category" label="Category" placeholder="Camera" />
        <div className="sm:col-span-4">
          <button
            type="submit"
            className="h-11 rounded-lg bg-blue-800 px-5 text-sm font-semibold text-white active:bg-blue-900"
          >
            Add product
          </button>
        </div>
      </form>

      <p className="mb-3 text-xs text-slate-500">
        This catalogue is what removes handwritten model numbers from the job
        sheet — the engineer selects instead of writing.
      </p>

      {products.length === 0 ? (
        <EmptyState>No products yet. Add the ones you fit most often.</EmptyState>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {products.map((p) => (
            <li key={p.id} className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-sm font-medium ${
                    p.active ? 'text-slate-900' : 'text-slate-400 line-through'
                  }`}
                >
                  {p.name}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {p.modelNo ? (
                    <span className="font-mono text-blue-700">{p.modelNo}</span>
                  ) : (
                    'No model no.'
                  )}
                  {p.brand ? ` · ${p.brand}` : ''}
                  {p.category ? ` · ${p.category}` : ''}
                </p>
              </div>
              <form action={toggleProduct}>
                <input type="hidden" name="id" value={p.id} />
                <button
                  type="submit"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 active:bg-slate-50"
                >
                  {p.active ? 'Hide' : 'Show'}
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
