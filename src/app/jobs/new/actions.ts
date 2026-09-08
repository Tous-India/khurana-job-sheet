'use server'

import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'
import { createClient as insertClient, insertJobSheet } from '@/lib/db'
import { createWithJobNumber } from '@/lib/job-number'

export type SubmitPayload = {
  engineerId: string
  clientId: string | null
  siteFirmName: string
  contactPerson: string
  mobileNo: string
  address: string
  handoverReport: string
  dateOfWorkDone: string
  lineItems: {
    description: string
    modelNo: string
    qty: number
    returnMat: number
    consumedMat: number
  }[]
  faultyItems: { description: string; qty: number }[]
  remarks: string
  clientOtherMaterials: string
  photos: { url: string; caption: string }[]
  signatureData: string
  latitude: number | null
  longitude: number | null
  locationAddress: string | null
}

export async function submitJobSheet(payload: SubmitPayload) {
  // Signature is the one hard gate (README 5.6) — re-checked server-side so a
  // client-side bypass cannot produce an unsigned sheet.
  if (!payload.signatureData) {
    return { ok: false as const, error: 'Customer signature is required.' }
  }

  const date = new Date()

  try {
    const job = await createWithJobNumber(date, (jobNo) =>
      insertJobSheet({
        jobNo,
        shareToken: nanoid(21),
        date,
        dateOfWorkDone: payload.dateOfWorkDone
          ? new Date(payload.dateOfWorkDone)
          : date,
        engineerId: payload.engineerId,
        clientId: payload.clientId,
        siteFirmName: payload.siteFirmName,
        contactPerson: payload.contactPerson,
        mobileNo: payload.mobileNo,
        address: payload.address,
        handoverReport: payload.handoverReport || null,
        remarks: payload.remarks || null,
        clientOtherMaterials: payload.clientOtherMaterials || null,
        signatureData: payload.signatureData,
        latitude: payload.latitude,
        longitude: payload.longitude,
        locationAddress: payload.locationAddress,
        // Blank rows are the wizard's auto-added trailing rows, not data.
        lineItems: payload.lineItems
          .filter((li) => li.description.trim())
          .map((li, idx) => ({
            sortOrder: idx + 1,
            description: li.description.trim(),
            modelNo: li.modelNo.trim() || null,
            qty: li.qty,
            returnMat: li.returnMat,
            consumedMat: li.consumedMat,
          })),
        faultyItems: payload.faultyItems
          .filter((fi) => fi.description.trim())
          .map((fi, idx) => ({
            sortOrder: idx + 1,
            description: fi.description.trim(),
            qty: fi.qty,
            clientName: payload.siteFirmName,
          })),
        photos: payload.photos.map((p) => ({
          url: p.url,
          caption: p.caption || null,
        })),
      }),
    )

    revalidatePath('/jobs')
    return { ok: true as const, job }
  } catch (error) {
    console.error('submitJobSheet failed', error)
    return {
      ok: false as const,
      error: 'Could not save the job sheet. Your draft is safe — try again.',
    }
  }
}

/** Saves a client typed in fresh, so it is offered next time. */
export async function createClient(input: {
  firmName: string
  contactPerson: string
  phone: string
  address: string
}) {
  const client = await insertClient({
    firmName: input.firmName,
    contactPerson: input.contactPerson || null,
    phone: input.phone || null,
    address: input.address || null,
  })
  return { id: client.id }
}
