'use client'

/**
 * Quantity stepper (README 5.4). Tapping beats typing, and the value defaults
 * to 0 rather than blank so RETURN/CONSUMED are never ambiguous on the sheet.
 * Buttons are 52px — larger than the 48px floor, since these are the most
 * tapped controls in the wizard and get used with dusty hands.
 */
export function Stepper({
  label,
  value,
  onChange,
  tone = 'slate',
}: {
  label: string
  value: number
  onChange: (next: number) => void
  tone?: 'slate' | 'blue'
}) {
  const accent =
    tone === 'blue'
      ? 'text-blue-800 border-blue-200 bg-blue-50/60'
      : 'text-slate-700 border-slate-200 bg-white'

  return (
    <div className="flex-1">
      <span className="mb-1 block text-center text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <div className={`flex items-center rounded-lg border ${accent}`}>
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => onChange(Math.max(0, value - 1))}
          className="flex h-[52px] w-[46px] shrink-0 items-center justify-center rounded-l-lg text-2xl font-medium text-slate-500 active:bg-slate-100 disabled:opacity-30"
          disabled={value <= 0}
        >
          &minus;
        </button>
        <span className="flex-1 text-center text-lg font-semibold tabular-nums">
          {value}
        </span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => onChange(value + 1)}
          className="flex h-[52px] w-[46px] shrink-0 items-center justify-center rounded-r-lg text-2xl font-medium text-slate-500 active:bg-slate-100"
        >
          +
        </button>
      </div>
    </div>
  )
}
