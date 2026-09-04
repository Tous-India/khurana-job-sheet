'use client'

import { useState } from 'react'
import type { DraftLineItem, JobDraft } from '@/lib/draft'
import { PickerSheet } from '@/components/picker-sheet'
import { Stepper } from '@/components/stepper'

type ProductPick = {
  id: string
  primary: string
  secondary: string
  modelNo: string
}

/**
 * Step 2. Selecting a product auto-fills the model number — the single field
 * the office can never read off the paper sheet (README 5.3). A new blank row
 * appears as soon as the last one is filled, so there is no "Add row" to hunt.
 */
export function StepWorkDone({
  draft,
  products,
  onChange,
  emptyLineItem,
}: {
  draft: JobDraft
  products: ProductPick[]
  onChange: (patch: Partial<JobDraft>) => void
  emptyLineItem: () => DraftLineItem
}) {
  const [pickingFor, setPickingFor] = useState<number | null>(null)

  function updateRow(index: number, patch: Partial<DraftLineItem>) {
    const next = draft.lineItems.map((li, i) =>
      i === index ? { ...li, ...patch } : li,
    )
    // Auto-add the next row once the last one has a description, capped at the
    // paper form's ten rows.
    const last = next[next.length - 1]
    if (last.description.trim() && next.length < 10) next.push(emptyLineItem())
    onChange({ lineItems: next })
  }

  function removeRow(index: number) {
    const next = draft.lineItems.filter((_, i) => i !== index)
    onChange({ lineItems: next.length ? next : [emptyLineItem()] })
  }

  return (
    <div className="space-y-3">
      {draft.lineItems.map((li, i) => {
        const filled = Boolean(li.description.trim())
        return (
          <div
            key={i}
            className={`rounded-xl border p-3 ${
              filled ? 'border-slate-200 bg-white' : 'border-dashed border-slate-300 bg-slate-50/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[11px] font-semibold text-slate-600">
                {i + 1}
              </span>
              <button
                type="button"
                onClick={() => setPickingFor(i)}
                className="min-h-[48px] flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-left active:bg-slate-50"
              >
                <span
                  className={`block truncate text-sm ${
                    filled ? 'font-medium text-slate-900' : 'text-slate-400'
                  }`}
                >
                  {li.description || 'Tap to choose product'}
                </span>
                {li.modelNo && (
                  <span className="block truncate font-mono text-[11px] text-blue-700">
                    {li.modelNo}
                  </span>
                )}
              </button>
              {filled && (
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  aria-label={`Remove row ${i + 1}`}
                  className="flex h-11 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 active:bg-slate-100"
                >
                  &times;
                </button>
              )}
            </div>

            {filled && (
              <div className="mt-3 flex gap-2">
                <Stepper
                  label="Qty"
                  value={li.qty}
                  onChange={(v) => updateRow(i, { qty: v })}
                  tone="blue"
                />
                <Stepper
                  label="Return"
                  value={li.returnMat}
                  onChange={(v) => updateRow(i, { returnMat: v })}
                />
                <Stepper
                  label="Consumed"
                  value={li.consumedMat}
                  onChange={(v) => updateRow(i, { consumedMat: v })}
                />
              </div>
            )}
          </div>
        )
      })}

      {pickingFor !== null && (
        <PickerSheet
          title="Choose product"
          options={products}
          allowFreeText
          freeTextLabel="Not in list"
          onClose={() => setPickingFor(null)}
          onSelect={(picked) => {
            if ('freeText' in picked) {
              updateRow(pickingFor, {
                description: picked.freeText,
                modelNo: '',
                qty: Math.max(1, draft.lineItems[pickingFor]?.qty ?? 0),
              })
            } else {
              const p = products.find((x) => x.id === picked.id)
              if (p) {
                // Model number arrives with the product — never typed.
                updateRow(pickingFor, {
                  description: p.primary,
                  modelNo: p.modelNo,
                  qty: Math.max(1, draft.lineItems[pickingFor]?.qty ?? 0),
                })
              }
            }
            setPickingFor(null)
          }}
        />
      )}
    </div>
  )
}
