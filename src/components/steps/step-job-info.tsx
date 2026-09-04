'use client'

import { useState } from 'react'
import type { ClientOption } from '@/lib/recent'
import type { JobDraft } from '@/lib/draft'
import { PickerSheet } from '@/components/picker-sheet'

/**
 * Step 1. Date, job number and engineer are auto — the three fields most often
 * left blank on the paper sheet (README 5.1) — so they are shown as facts, not
 * inputs. Picking a client fills contact, mobile and address in one tap.
 */
export function StepJobInfo({
  draft,
  clients,
  engineerName,
  onChange,
}: {
  draft: JobDraft
  clients: ClientOption[]
  engineerName: string
  onChange: (patch: Partial<JobDraft>) => void
}) {
  const [picking, setPicking] = useState(false)

  const today = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div className="space-y-3">
      {/* Auto-filled facts, not inputs. */}
      <dl className="grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-3 text-center">
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-slate-500">Date</dt>
          <dd className="mt-0.5 text-xs font-semibold text-slate-800">{today}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-slate-500">Job No.</dt>
          <dd className="mt-0.5 text-xs font-semibold text-slate-800">Auto</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-slate-500">Engineer</dt>
          <dd className="mt-0.5 truncate text-xs font-semibold text-slate-800">
            {engineerName}
          </dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={() => setPicking(true)}
        className="flex min-h-[60px] w-full items-center justify-between gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-left active:bg-slate-50"
      >
        <span className="min-w-0">
          <span className="block text-[11px] uppercase tracking-wide text-slate-500">
            Site &amp; firm name
          </span>
          <span
            className={`block truncate text-sm ${
              draft.siteFirmName ? 'font-medium text-slate-900' : 'text-slate-400'
            }`}
          >
            {draft.siteFirmName || 'Tap to choose client'}
          </span>
        </span>
        <span aria-hidden className="shrink-0 text-slate-400">
          &rsaquo;
        </span>
      </button>

      <Field
        label="Contact person"
        value={draft.contactPerson}
        onChange={(v) => onChange({ contactPerson: v })}
        placeholder="Who did you meet?"
      />

      <Field
        label="Mobile no."
        value={draft.mobileNo}
        onChange={(v) => onChange({ mobileNo: v.replace(/\D/g, '').slice(0, 10) })}
        placeholder="10 digits"
        inputMode="numeric"
        type="tel"
      />

      <label className="block">
        <span className="mb-1 block text-[11px] uppercase tracking-wide text-slate-500">
          Site address
        </span>
        <textarea
          value={draft.address}
          onChange={(e) => onChange({ address: e.target.value })}
          rows={2}
          placeholder="Auto-fills when you pick a client"
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-[11px] uppercase tracking-wide text-slate-500">
          Checked &amp; handed over by engg.
          <span className="ml-1 normal-case text-slate-400">(optional)</span>
        </span>
        <textarea
          value={draft.handoverReport}
          onChange={(e) => onChange({ handoverReport: e.target.value })}
          rows={2}
          placeholder="What did you check and hand over?"
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </label>

      {picking && (
        <PickerSheet
          title="Choose client"
          options={clients.map((c) => ({
            id: c.id,
            primary: c.firmName,
            secondary: [c.contactPerson, c.phone].filter(Boolean).join(' · '),
          }))}
          allowFreeText
          freeTextLabel="New client"
          onClose={() => setPicking(false)}
          onSelect={(picked) => {
            if ('freeText' in picked) {
              onChange({ clientId: null, siteFirmName: picked.freeText })
            } else {
              const c = clients.find((x) => x.id === picked.id)
              if (c) {
                // One tap fills four fields.
                onChange({
                  clientId: c.id,
                  siteFirmName: c.firmName,
                  contactPerson: c.contactPerson ?? draft.contactPerson,
                  mobileNo: (c.phone ?? draft.mobileNo).replace(/\D/g, '').slice(0, 10),
                  address: c.address ?? draft.address,
                })
              }
            }
            setPicking(false)
          }}
        />
      )}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  inputMode?: 'numeric' | 'text'
  type?: string
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-[52px] w-full rounded-xl border border-slate-300 px-3 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  )
}
