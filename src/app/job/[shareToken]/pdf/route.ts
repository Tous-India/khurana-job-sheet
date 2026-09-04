import { renderToBuffer } from '@react-pdf/renderer'
import { prisma } from '@/lib/prisma'
import { registerPdfFonts } from '@/pdf/fonts'
import { loadPdfAssets, resolvePhotoSrc } from '@/pdf/render'
import { JobSheetDocument } from '@/pdf/job-sheet-document'

/**
 * Public PDF, addressed by an unguessable shareToken rather than the sequential
 * job number (README 7.1) — job numbers are trivially enumerable, which would
 * expose every other customer's name, address and mobile.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ shareToken: string }> },
) {
  const { shareToken } = await params

  const job = await prisma.jobSheet.findUnique({
    where: { shareToken },
    include: {
      engineer: { select: { name: true } },
      lineItems: { orderBy: { sortOrder: 'asc' } },
      faultyItems: { orderBy: { sortOrder: 'asc' } },
      photos: { orderBy: { takenAt: 'asc' } },
    },
  })

  if (!job) {
    return new Response('Job sheet not found', { status: 404 })
  }

  registerPdfFonts()
  const assets = await loadPdfAssets()

  const photos = await Promise.all(
    job.photos.map(async (p) => ({
      url: await resolvePhotoSrc(p.url),
      caption: p.caption,
      takenAt: p.takenAt,
    })),
  )

  const buffer = await renderToBuffer(
    JobSheetDocument({
      job: {
        jobNo: job.jobNo,
        date: job.date,
        dateOfWorkDone: job.dateOfWorkDone,
        engineerName: job.engineer.name,
        siteFirmName: job.siteFirmName,
        contactPerson: job.contactPerson,
        mobileNo: job.mobileNo,
        address: job.address,
        handoverReport: job.handoverReport,
        remarks: job.remarks,
        clientOtherMaterials: job.clientOtherMaterials,
        signatureData: job.signatureData,
        latitude: job.latitude,
        longitude: job.longitude,
        locationAddress: job.locationAddress,
        lineItems: job.lineItems,
        faultyItems: job.faultyItems,
        photos,
      },
      assets,
    }),
  )

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${job.jobNo}.pdf"`,
      // Sheets are immutable once submitted.
      'Cache-Control': 'public, max-age=3600, immutable',
    },
  })
}
