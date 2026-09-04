'use client'

import type { DraftFaultyItem, JobDraft } from '@/lib/draft'
import { Stepper } from '@/components/stepper'

/**
 * Step 3. Entirely optional — many visits take nothing back. Hindi and English
 * both go in the same field (README 4.3); the layout font covers Devanagari.
 */
export function StepFaulty({
  draft,
  onChange,
  emptyFaultyItem,
}: {
  draft: JobDraft
  onChange: (patch: Partial<JobDraft>) => void
  emptyFaultyItem: () => DraftFaultyItem
}) {
  function updateRow(index: number, patch: Partial<DraftFaultyItem>) {
    const next = draft.faultyItems.map((fi, i) =>
      i === index ? { ...fi, ...patch } : fi,
    )
    const last = next[next.length - 1]
    if (last.description.trim() && next.length < 5) next.push(emptyFaultyItem())
    onChange({ faultyItems: next })
  }

  return (
    <div className="space-y-3">
      <p className="rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600">
        Anything you are taking back from the client. Skip if nothing.
      </p>

      {draft.faultyItems.map((fi, i) => (
        <div
          key={i}
          className={`rounded-xl border p-3 ${
            fi.description.trim()
              ? 'border-slate-200 bg-white'
              : 'border-dashed border-slate-300 bg-slate-50/60'
          }`}
        >
          <div className="flex items-start gap-2">
            <span className="mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[11px] font-semibold text-slate-600">
              {i + 1}
            </span>
            <textarea
              value={fi.description}
              onChange={(e) => updateRow(i, { description: e.target.value })}
              rows={2}
              placeholder="What did you take back? हिंदी में भी लिख सकते हैं"
              className="min-h-[56px] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          {fi.description.trim() && (
            <div className="mt-3 flex gap-2">
              <Stepper
                label="Qty"
                value={fi.qty}
                onChange={(v) => updateRow(i, { qty: v })}
                tone="blue"
              />
              <div className="flex-1" />
              <div className="flex-1" />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
