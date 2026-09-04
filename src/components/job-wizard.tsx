'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ClientOption, ProductOption } from '@/lib/recent'
import {
  clearDraft,
  draftHasContent,
  emptyDraft,
  emptyFaultyItem,
  emptyLineItem,
  loadDraft,
  saveDraft,
  type JobDraft,
} from '@/lib/draft'
import { getCurrentEngineer, type CurrentEngineer } from '@/lib/current-engineer'
import { submitJobSheet } from '@/app/jobs/new/actions'
import { TOTAL_STEPS, WizardStep } from '@/components/wizard-chrome'
import { StepJobInfo } from '@/components/steps/step-job-info'
import { StepWorkDone } from '@/components/steps/step-work-done'
import { StepFaulty } from '@/components/steps/step-faulty'
import { StepRemarks } from '@/components/steps/step-remarks'
import { StepSignOff } from '@/components/steps/step-sign-off'

export function JobWizard({
  clients,
  products,
}: {
  clients: ClientOption[]
  products: ProductOption[]
}) {
  const router = useRouter()
  const [engineer, setEngineer] = useState<CurrentEngineer | null>(null)
  const [draft, setDraft] = useState<JobDraft>(emptyDraft)
  const [restored, setRestored] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const hydrated = useRef(false)

  // Restore any in-progress sheet before the first paint of real content.
  useEffect(() => {
    const current = getCurrentEngineer()
    if (!current) {
      router.replace('/')
      return
    }
    setEngineer(current)

    const saved = loadDraft()
    if (saved && draftHasContent(saved)) {
      setDraft(saved)
      setRestored(true)
    }
    hydrated.current = true
  }, [router])

  // Autosave on every change (README 5.9). Skipped until hydration so the
  // empty initial state cannot overwrite a real saved draft, and skipped for an
  // empty draft so discarding does not immediately rewrite what it cleared.
  useEffect(() => {
    if (!hydrated.current) return
    if (!draftHasContent(draft)) {
      clearDraft()
      return
    }
    saveDraft(draft)
  }, [draft])

  const update = useCallback((patch: Partial<JobDraft>) => {
    setDraft((d) => ({ ...d, ...patch }))
    setError(null)
  }, [])

  const step = draft.step

  const goBack = useCallback(() => {
    setError(null)
    if (step === 1) {
      router.push('/jobs')
      return
    }
    setDraft((d) => ({ ...d, step: d.step - 1 }))
  }, [step, router])

  /**
   * Forgiving validation: one short line naming the single thing that is
   * missing, never a list, and never clearing what he already typed.
   */
  const validate = useCallback((d: JobDraft): string | null => {
    if (d.step === 1) {
      if (!d.siteFirmName.trim()) return 'Pick or type the site / firm name.'
      if (!d.contactPerson.trim()) return 'Who did you meet at the site?'
      if (!/^\d{10}$/.test(d.mobileNo.replace(/\D/g, '')))
        return 'Mobile number should be 10 digits.'
      if (!d.address.trim()) return 'Add the site address.'
    }
    if (d.step === 2) {
      if (!d.lineItems.some((li) => li.description.trim()))
        return 'Add at least one product or description.'
    }
    // Steps 3 and 4 are entirely optional — never block on them.
    if (d.step === 5 && !d.signatureData)
      return 'Customer signature is required before submitting.'
    return null
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!engineer) return
    setSubmitting(true)
    setError(null)

    const result = await submitJobSheet({
      engineerId: engineer.id,
      clientId: draft.clientId,
      siteFirmName: draft.siteFirmName.trim(),
      contactPerson: draft.contactPerson.trim(),
      mobileNo: draft.mobileNo.replace(/\D/g, ''),
      address: draft.address.trim(),
      handoverReport: draft.handoverReport.trim(),
      dateOfWorkDone: draft.dateOfWorkDone,
      lineItems: draft.lineItems,
      faultyItems: draft.faultyItems,
      remarks: draft.remarks.trim(),
      clientOtherMaterials: draft.clientOtherMaterials.trim(),
      photos: draft.photos.map((p) => ({ url: p.dataUrl, caption: p.caption })),
      signatureData: draft.signatureData ?? '',
      latitude: draft.latitude,
      longitude: draft.longitude,
      locationAddress: draft.locationAddress,
    })

    if (!result.ok) {
      // Draft deliberately survives a failed submit.
      setError(result.error)
      setSubmitting(false)
      return
    }

    clearDraft()
    router.push(`/jobs/${result.job.id}?created=1`)
  }, [draft, engineer, router])

  const goNext = useCallback(() => {
    const problem = validate(draft)
    if (problem) {
      setError(problem)
      return
    }
    if (step === TOTAL_STEPS) {
      void handleSubmit()
      return
    }
    setDraft((d) => ({ ...d, step: d.step + 1 }))
  }, [draft, step, validate, handleSubmit])

  const discard = useCallback(() => {
    // The one place a confirmation dialog is warranted.
    if (!window.confirm('Discard this job sheet and start again?')) return
    clearDraft()
    setDraft(emptyDraft())
    setRestored(false)
  }, [])

  const productOptions = useMemo(
    () =>
      products.map((p) => ({
        id: p.id,
        primary: p.name,
        secondary: [p.modelNo, p.brand].filter(Boolean).join(' · '),
        modelNo: p.modelNo ?? '',
      })),
    [products],
  )

  if (!engineer) return null

  return (
    <WizardStep
      step={step}
      onBack={goBack}
      onNext={goNext}
      nextDisabled={submitting}
      nextLabelOverride={submitting ? 'Saving…' : undefined}
      error={error}
    >
      {restored && step === 1 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-900">
          <span className="flex-1">Draft restored.</span>
          <button
            type="button"
            onClick={discard}
            className="font-semibold underline underline-offset-2"
          >
            Discard
          </button>
        </div>
      )}

      {step === 1 && (
        <StepJobInfo
          draft={draft}
          clients={clients}
          engineerName={engineer.name}
          onChange={update}
        />
      )}
      {step === 2 && (
        <StepWorkDone
          draft={draft}
          products={productOptions}
          onChange={update}
          emptyLineItem={emptyLineItem}
        />
      )}
      {step === 3 && (
        <StepFaulty
          draft={draft}
          onChange={update}
          emptyFaultyItem={emptyFaultyItem}
        />
      )}
      {step === 4 && <StepRemarks draft={draft} onChange={update} />}
      {step === 5 && <StepSignOff draft={draft} onChange={update} />}
    </WizardStep>
  )
}
