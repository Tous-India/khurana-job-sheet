'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

/**
 * Debounced search, pushed into the URL so the server component re-queries.
 * Keeping state in the URL means a search is shareable and survives a reload.
 */
export function JobSearch({
  initialQuery,
  tab,
}: {
  initialQuery: string
  tab: string
}) {
  const router = useRouter()
  const [value, setValue] = useState(initialQuery)

  useEffect(() => {
    // Skip the push when nothing changed, so typing then reverting is a no-op.
    if (value === initialQuery) return
    const id = setTimeout(() => {
      const params = new URLSearchParams({ tab })
      if (value.trim()) params.set('q', value.trim())
      router.replace(`/jobs?${params.toString()}`)
    }, 300)
    return () => clearTimeout(id)
  }, [value, initialQuery, tab, router])

  return (
    <label className="relative block">
      <span className="sr-only">Search job sheets</span>
      <input
        type="search"
        inputMode="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search job no. or client…"
        className="tap-target w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  )
}
