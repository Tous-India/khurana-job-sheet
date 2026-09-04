import Link from 'next/link'
import type { ReactNode } from 'react'

const TABS = [
  { href: '/admin/engineers', label: 'Engineers' },
  { href: '/admin/clients', label: 'Clients' },
  { href: '/admin/products', label: 'Products' },
]

/** Owner-facing chrome. Wider than the field UI — this is used at a desk. */
export function AdminShell({
  active,
  children,
}: {
  active: string
  children: ReactNode
}) {
  return (
    <main className="flex-1 pb-16">
      <header className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-bold tracking-tight">
              KHURANA <span className="font-normal">ELECTRONICS</span>
            </h1>
            <p className="text-xs text-slate-500">Admin</p>
          </div>
          <Link
            href="/jobs"
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700"
          >
            Job sheets
          </Link>
        </div>
      </header>

      <nav className="border-b border-slate-200 bg-white px-4">
        <div className="mx-auto flex max-w-3xl gap-1">
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`border-b-2 px-3 py-3 text-sm font-medium ${
                active === t.href
                  ? 'border-blue-700 text-blue-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-4 py-5">{children}</div>
    </main>
  )
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
      {children}
    </p>
  )
}
