'use client'

/**
 * Wizard draft persistence (README 5.9). Sites often have poor signal, so the
 * in-progress sheet is written to localStorage on every change and restored on
 * reload. Cleared only on a successful submit, or an explicit discard.
 */

const DRAFT_KEY = 'ke.jobDraft'

export type DraftLineItem = {
  description: string
  modelNo: string
  qty: number
  returnMat: number
  consumedMat: number
}

export type DraftFaultyItem = {
  description: string
  qty: number
}

export type DraftPhoto = {
  dataUrl: string
  caption: string
}

export type JobDraft = {
  step: number
  clientId: string | null
  siteFirmName: string
  contactPerson: string
  mobileNo: string
  address: string
  handoverReport: string
  dateOfWorkDone: string
  lineItems: DraftLineItem[]
  faultyItems: DraftFaultyItem[]
  remarks: string
  clientOtherMaterials: string
  photos: DraftPhoto[]
  signatureData: string | null
  latitude: number | null
  longitude: number | null
  locationAddress: string | null
  savedAt: number
}

export function emptyLineItem(): DraftLineItem {
  // Steppers default to 0, never blank, so the office can always reconcile.
  return { description: '', modelNo: '', qty: 0, returnMat: 0, consumedMat: 0 }
}

export function emptyFaultyItem(): DraftFaultyItem {
  return { description: '', qty: 0 }
}

export function emptyDraft(): JobDraft {
  return {
    step: 1,
    clientId: null,
    siteFirmName: '',
    contactPerson: '',
    mobileNo: '',
    address: '',
    handoverReport: '',
    dateOfWorkDone: new Date().toISOString().slice(0, 10),
    lineItems: [emptyLineItem()],
    faultyItems: [emptyFaultyItem()],
    remarks: '',
    clientOtherMaterials: '',
    photos: [],
    signatureData: null,
    latitude: null,
    longitude: null,
    locationAddress: null,
    savedAt: Date.now(),
  }
}

export function loadDraft(): JobDraft | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<JobDraft>
    if (typeof parsed !== 'object' || parsed === null) return null
    // Merge onto a fresh draft so a draft saved by an older build, missing
    // fields added since, still restores instead of crashing the wizard.
    return { ...emptyDraft(), ...parsed }
  } catch {
    return null
  }
}

export function saveDraft(draft: JobDraft): void {
  try {
    window.localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ ...draft, savedAt: Date.now() }),
    )
  } catch {
    // Quota exceeded (photos are the usual cause) or storage disabled.
    // Non-fatal: the wizard keeps working, the draft just will not survive.
  }
}

export function clearDraft(): void {
  try {
    window.localStorage.removeItem(DRAFT_KEY)
  } catch {
    // Non-fatal.
  }
}

/** True when the draft holds anything worth restoring. */
export function draftHasContent(draft: JobDraft): boolean {
  return Boolean(
    draft.siteFirmName ||
      draft.contactPerson ||
      draft.mobileNo ||
      draft.remarks ||
      draft.signatureData ||
      draft.photos.length ||
      draft.lineItems.some((li) => li.description) ||
      draft.faultyItems.some((fi) => fi.description),
  )
}
