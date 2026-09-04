'use client'

import type { ReactNode } from 'react'

export const STEP_LABELS = [
  'Job info',
  'Work done',
  'Faulty material',
  'Remarks & photos',
  'Sign off',
] as const

export const TOTAL_STEPS = STEP_LABELS.length

/**
 * Wizard frame. The Next button is sticky at the bottom of every step and names
 * the step it leads to, so the engineer never scrolls to find it and never
 * wonders what comes next.
 */
export function WizardStep({
  step,
  onBack,
  onNext,
  nextDisabled = false,
  nextLabelOverride,
  error,
  children,
}: {
  step: number
  onBack: () => void
  onNext: () => void
  nextDisabled?: boolean
  nextLabelOverride?: string
  error?: string | null
  children: ReactNode
}) {
  const nextLabel =
    nextLabelOverride ??
    (step < TOTAL_STEPS
      ? `Next: ${STEP_LABELS[step]} ${step + 1}/${TOTAL_STEPS}`
      : 'Submit job sheet')

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white px-4 py-2">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="-ml-2 flex h-11 w-11 items-center justify-center rounded-lg text-slate-500 active:bg-slate-100"
            aria-label="Back"
          >
            &larr;
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">
              {STEP_LABELS[step - 1]}
            </p>
            <div className="mt-1 flex gap-1" aria-hidden>
              {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                <span
                  key={i}
                  className={`h-1 flex-1 rounded-full ${
                    i < step ? 'bg-blue-700' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>
          <span className="shrink-0 text-xs font-medium tabular-nums text-slate-400">
            {step}/{TOTAL_STEPS}
          </span>
        </div>
      </header>

      {/* Padding-bottom clears the sticky action bar. */}
      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-32 pt-4">
        {children}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-md px-4 py-3">
          {error && (
            <p
              role="alert"
              className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900"
            >
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={onNext}
            disabled={nextDisabled}
            className="flex h-[56px] w-full items-center justify-center rounded-xl bg-blue-800 text-base font-semibold text-white shadow-sm transition active:bg-blue-900 disabled:bg-slate-300"
          >
            {nextLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
