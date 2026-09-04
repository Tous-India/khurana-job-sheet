'use client'

import { useMemo, useState } from 'react'

export type PickerOption = {
  id: string
  primary: string
  secondary?: string | null
  hint?: string | null
}

/**
 * Full-screen picker. Options arrive already sorted recent-first, so the right
 * answer is usually the first row and the engineer taps rather than types. The
 * search box is deliberately not autofocused — surfacing the keyboard on open
 * would defeat the point.
 */
export function PickerSheet({
  title,
  options,
  onSelect,
  onClose,
  allowFreeText = false,
  freeTextLabel = 'Use what I typed',
}: {
  title: string
  options: PickerOption[]
  onSelect: (option: PickerOption | { freeText: string }) => void
  onClose: () => void
  allowFreeText?: boolean
  freeTextLabel?: string
}) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter(
      (o) =>
        o.primary.toLowerCase().includes(q) ||
        (o.secondary ?? '').toLowerCase().includes(q) ||
        (o.hint ?? '').toLowerCase().includes(q),
    )
  }, [options, query])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <header className="flex items-center gap-2 border-b border-slate-200 px-3 py-2">
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-500 active:bg-slate-100"
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="flex-1 text-sm font-semibold">{title}</h2>
      </header>

      <div className="border-b border-slate-100 px-3 py-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search…"
          className="h-12 w-full rounded-lg border border-slate-300 px-3 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <ul className="flex-1 overflow-y-auto overscroll-contain">
        {filtered.map((o, i) => (
          <li key={o.id}>
            <button
              type="button"
              onClick={() => onSelect(o)}
              className="flex min-h-[60px] w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left active:bg-blue-50"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-slate-900">
                  {o.primary}
                </span>
                {o.secondary && (
                  <span className="block truncate text-xs text-slate-500">
                    {o.secondary}
                  </span>
                )}
              </span>
              {i === 0 && !query && (
                <span className="shrink-0 rounded bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                  RECENT
                </span>
              )}
              {o.hint && (
                <span className="shrink-0 text-[11px] text-slate-400">{o.hint}</span>
              )}
            </button>
          </li>
        ))}

        {filtered.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-slate-500">
            Nothing matches “{query}”.
          </li>
        )}
      </ul>

      {/* Free text keeps an unlisted item from ever blocking a submission. */}
      {allowFreeText && query.trim() && (
        <div className="border-t border-slate-200 p-3">
          <button
            type="button"
            onClick={() => onSelect({ freeText: query.trim() })}
            className="flex h-[52px] w-full items-center justify-center rounded-xl border-2 border-dashed border-blue-300 text-sm font-medium text-blue-800 active:bg-blue-50"
          >
            {freeTextLabel}: “{query.trim()}”
          </button>
        </div>
      )}
    </div>
  )
}
