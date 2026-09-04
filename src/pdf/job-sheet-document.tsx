import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer'
import type { Style } from '@react-pdf/types'
import { FONT_FAMILY, fontFor } from './fonts'

export type PdfJob = {
  jobNo: string
  date: Date
  dateOfWorkDone: Date | null
  engineerName: string
  siteFirmName: string
  contactPerson: string
  mobileNo: string
  address: string
  handoverReport: string | null
  remarks: string | null
  clientOtherMaterials: string | null
  signatureData: string | null
  latitude: number | null
  longitude: number | null
  locationAddress: string | null
  lineItems: {
    sortOrder: number
    description: string
    modelNo: string | null
    qty: number
    returnMat: number
    consumedMat: number
  }[]
  faultyItems: {
    sortOrder: number
    description: string
    qty: number
    clientName: string | null
  }[]
  photos: { url: string; caption: string | null; takenAt: Date }[]
}

export type PdfAssets = {
  headerImage: string
  footerImage: string
  qrDataUrl: string | null
}

const BLUE = '#1e40af'
const BORDER = '#94a3b8'

const s = StyleSheet.create({
  page: {
    fontFamily: FONT_FAMILY,
    fontSize: 8,
    paddingTop: 8,
    paddingBottom: 46,
    paddingHorizontal: 20,
    color: '#0f172a',
  },
  headerImage: { width: '100%', height: 46, objectFit: 'fill' },
  titleRow: { alignItems: 'center', marginTop: 4, marginBottom: 6 },
  jobsheetPill: {
    backgroundColor: BLUE,
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
    paddingVertical: 2,
    paddingHorizontal: 14,
    borderRadius: 8,
    letterSpacing: 1,
  },
  wordmark: { fontSize: 15, fontWeight: 'bold', marginTop: 3, color: BLUE },

  box: { borderWidth: 0.8, borderColor: BORDER },
  row: { flexDirection: 'row' },
  cell: {
    borderRightWidth: 0.8,
    borderBottomWidth: 0.8,
    borderColor: BORDER,
    paddingHorizontal: 3,
    paddingVertical: 3,
    justifyContent: 'center',
  },
  label: { fontSize: 6, color: '#475569', marginBottom: 1 },
  value: { fontSize: 8 },

  thead: { backgroundColor: '#dbeafe' },
  th: { fontSize: 6.5, fontWeight: 'bold', color: '#1e3a8a' },

  sectionBar: {
    backgroundColor: '#dbeafe',
    paddingVertical: 2,
    paddingHorizontal: 3,
    borderWidth: 0.8,
    borderColor: BORDER,
    borderBottomWidth: 0,
  },
  sectionBarText: { fontSize: 6.5, fontWeight: 'bold', color: '#1e3a8a' },

  confirmText: { fontSize: 6.5, lineHeight: 1.35 },
  footerImage: {
    position: 'absolute',
    bottom: 14,
    left: 20,
    right: 20,
    height: 16,
    objectFit: 'fill',
  },
  pageNote: {
    position: 'absolute',
    bottom: 4,
    left: 20,
    right: 20,
    textAlign: 'center',
    fontSize: 5.5,
    color: '#94a3b8',
  },
})

function fmtDate(d: Date | null): string {
  if (!d) return '—'
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/** Every user-entered string routes through here so Hindi picks the right face. */
function T({
  children,
  style,
}: {
  children: string | null | undefined
  style?: Style
}) {
  const text = children ?? ''
  return <Text style={[{ fontFamily: fontFor(text) }, style ?? {}]}>{text}</Text>
}

const LINE_COLS = [18, 168, 92, 32, 52, 58]
const FAULTY_COLS = [18, 260, 32, 110]

export function JobSheetDocument({
  job,
  assets,
}: {
  job: PdfJob
  assets: PdfAssets
}) {
  const lineRows = [...job.lineItems]
  while (lineRows.length < 6) {
    lineRows.push({
      sortOrder: lineRows.length + 1,
      description: '',
      modelNo: null,
      qty: 0,
      returnMat: 0,
      consumedMat: 0,
    })
  }

  const faultyRows = [...job.faultyItems]
  while (faultyRows.length < 3) {
    faultyRows.push({
      sortOrder: faultyRows.length + 1,
      description: '',
      qty: 0,
      clientName: null,
    })
  }

  const locationLine =
    job.locationAddress ??
    (job.latitude != null && job.longitude != null
      ? `${job.latitude.toFixed(5)}, ${job.longitude.toFixed(5)}`
      : '—')

  return (
    <Document
      title={`Job Sheet ${job.jobNo}`}
      author="Khurana Electronics"
      subject={`Job sheet for ${job.siteFirmName}`}
    >
      <Page size="A4" style={s.page}>
        <Image src={assets.headerImage} style={s.headerImage} fixed={false} />

        <View style={s.titleRow}>
          <Text style={s.jobsheetPill}>JOBSHEET</Text>
          <Text style={s.wordmark}>KHURANA ELECTRONICS</Text>
        </View>

        {/* Header block */}
        <View style={s.box}>
          <View style={s.row}>
            <View style={[s.cell, { width: 150 }]}>
              <Text style={s.label}>DATE</Text>
              <Text style={s.value}>{fmtDate(job.date)}</Text>
            </View>
            <View style={[s.cell, { width: 160 }]}>
              <Text style={s.label}>JOB NO.</Text>
              <Text style={[s.value, { fontWeight: 'bold', color: BLUE }]}>
                {job.jobNo}
              </Text>
            </View>
            <View style={[s.cell, { flex: 1, borderRightWidth: 0 }]}>
              <Text style={s.label}>ENGG. NAME</Text>
              <T style={s.value}>{job.engineerName}</T>
            </View>
          </View>

          <View style={s.row}>
            <View style={[s.cell, { width: 310 }]}>
              <Text style={s.label}>CONTACT PERSON</Text>
              <T style={s.value}>{job.contactPerson}</T>
            </View>
            <View style={[s.cell, { flex: 1, borderRightWidth: 0 }]}>
              <Text style={s.label}>MOB. NO.</Text>
              <Text style={s.value}>{job.mobileNo}</Text>
            </View>
          </View>

          <View style={s.row}>
            <View style={[s.cell, { flex: 1, borderRightWidth: 0 }]}>
              <Text style={s.label}>SITE &amp; FIRM NAME</Text>
              <T style={s.value}>{job.siteFirmName}</T>
            </View>
          </View>

          <View style={s.row}>
            <View style={[s.cell, { width: 270, minHeight: 42 }]}>
              <Text style={s.label}>ADDRESS</Text>
              <T style={s.value}>{job.address}</T>
            </View>
            <View
              style={[s.cell, { flex: 1, borderRightWidth: 0, minHeight: 42 }]}
            >
              <Text style={s.label}>CHECKED AND HAND OVER REPORT BY ENGG.</Text>
              <T style={s.value}>{job.handoverReport ?? ''}</T>
            </View>
          </View>

          <View style={s.row}>
            <View
              style={[s.cell, { flex: 1, borderRightWidth: 0, borderBottomWidth: 0 }]}
            >
              <Text style={s.label}>DATE OF WORK IS DONE</Text>
              <Text style={s.value}>{fmtDate(job.dateOfWorkDone)}</Text>
            </View>
          </View>
        </View>

        {/* Products table */}
        <View style={{ marginTop: 6 }}>
          <View style={[s.box, { borderBottomWidth: 0 }]}>
            <View style={[s.row, s.thead]}>
              {['S.NO.', 'NEW PRODUCT / DESCRIPTION', 'MODEL NO.', 'QTY.', 'RETURN MAT.', 'CONSUMED MAT.'].map(
                (h, i) => (
                  <View
                    key={h}
                    style={[
                      s.cell,
                      s.thead,
                      {
                        width: LINE_COLS[i],
                        borderRightWidth: i === LINE_COLS.length - 1 ? 0 : 0.8,
                        alignItems: i === 0 || i > 2 ? 'center' : 'flex-start',
                      },
                    ]}
                  >
                    <Text style={s.th}>{h}</Text>
                  </View>
                ),
              )}
            </View>

            {lineRows.map((li, idx) => (
              <View key={idx} style={s.row}>
                <View style={[s.cell, { width: LINE_COLS[0], alignItems: 'center' }]}>
                  <Text style={s.value}>{idx + 1}.</Text>
                </View>
                <View style={[s.cell, { width: LINE_COLS[1] }]}>
                  <T style={s.value}>{li.description}</T>
                </View>
                <View style={[s.cell, { width: LINE_COLS[2] }]}>
                  <T style={s.value}>{li.modelNo ?? ''}</T>
                </View>
                <View style={[s.cell, { width: LINE_COLS[3], alignItems: 'center' }]}>
                  <Text style={s.value}>{li.description ? li.qty : ''}</Text>
                </View>
                <View style={[s.cell, { width: LINE_COLS[4], alignItems: 'center' }]}>
                  <Text style={s.value}>{li.description ? li.returnMat : ''}</Text>
                </View>
                <View
                  style={[
                    s.cell,
                    { width: LINE_COLS[5], alignItems: 'center', borderRightWidth: 0 },
                  ]}
                >
                  <Text style={s.value}>{li.description ? li.consumedMat : ''}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Faulty material */}
        <View style={{ marginTop: 6 }}>
          <View style={[s.box, { borderBottomWidth: 0 }]}>
            <View style={[s.row, s.thead]}>
              {[
                { h: 'S.NO.', w: FAULTY_COLS[0] },
                { h: 'FAULTY MATERIAL RECEIVED FROM CLIENT', w: FAULTY_COLS[1] },
                { h: 'QTY.', w: FAULTY_COLS[2] },
                { h: 'CLIENT NAME', w: FAULTY_COLS[3] },
              ].map((c, i, arr) => (
                <View
                  key={c.h}
                  style={[
                    s.cell,
                    s.thead,
                    {
                      width: c.w,
                      borderRightWidth: i === arr.length - 1 ? 0 : 0.8,
                      alignItems: i === 0 || i === 2 ? 'center' : 'flex-start',
                    },
                  ]}
                >
                  <Text style={s.th}>{c.h}</Text>
                </View>
              ))}
            </View>

            {faultyRows.map((fi, idx) => (
              <View key={idx} style={s.row}>
                <View style={[s.cell, { width: FAULTY_COLS[0], alignItems: 'center' }]}>
                  <Text style={s.value}>{idx + 1}.</Text>
                </View>
                <View style={[s.cell, { width: FAULTY_COLS[1], minHeight: 16 }]}>
                  <T style={s.value}>{fi.description}</T>
                </View>
                <View style={[s.cell, { width: FAULTY_COLS[2], alignItems: 'center' }]}>
                  <Text style={s.value}>{fi.description ? fi.qty : ''}</Text>
                </View>
                <View
                  style={[s.cell, { width: FAULTY_COLS[3], borderRightWidth: 0 }]}
                >
                  <T style={s.value}>{fi.description ? (fi.clientName ?? '') : ''}</T>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Remarks + client's other materials */}
        <View style={[s.row, { marginTop: 6 }]}>
          <View style={[s.box, { width: 250, minHeight: 44, padding: 3 }]}>
            <Text style={s.label}>REMARKS :</Text>
            <T style={s.value}>{job.remarks ?? ''}</T>
          </View>
          <View
            style={[s.box, { flex: 1, minHeight: 44, padding: 3, borderLeftWidth: 0 }]}
          >
            <Text style={s.label}>
              PRODUCTS/PARTS WORTH AND OTHER MATERIALS WHICH ARE IN CLIENT&rsquo;S OTHER:
            </Text>
            <T style={s.value}>{job.clientOtherMaterials ?? ''}</T>
          </View>
        </View>

        {/* Confirmation + signature */}
        <View style={[s.row, { marginTop: 6 }]}>
          <View style={[s.box, { width: 250, padding: 4 }]}>
            <Text style={s.confirmText}>
              IT IS HEREBY CONFIRMED THAT THE ABOVE MENTIONED{'\n'}
              INSTALLTION HAS BEEN COMPLETED TO OUR SATISFACTION{'\n'}
              ADDRESS :- 1456-HBC-SEC-14-BEHIND GANDHI PARK SONIPAT-131001{'\n'}
              0130-4018060 - 9053000270
            </Text>
          </View>
          <View style={[s.box, { flex: 1, padding: 4, borderLeftWidth: 0 }]}>
            <Text style={s.label}>SIGNATURE WITH STAMP OF CLIENT</Text>
            <View style={{ height: 30, justifyContent: 'flex-end' }}>
              {job.signatureData ? (
                <Image
                  src={job.signatureData}
                  style={{ height: 28, objectFit: 'contain' }}
                />
              ) : null}
            </View>
            <View
              style={{
                borderTopWidth: 0.8,
                borderColor: BORDER,
                marginTop: 2,
                paddingTop: 2,
              }}
            >
              <Text style={s.label}>LOCATION</Text>
              <T style={{ fontSize: 6 }}>{locationLine}</T>
            </View>
          </View>
        </View>

        {/* Review QR + brand strip */}
        <View style={[s.row, { marginTop: 6, alignItems: 'flex-end' }]}>
          {assets.qrDataUrl ? (
            <View style={{ alignItems: 'center', width: 54 }}>
              <Image src={assets.qrDataUrl} style={{ width: 40, height: 40 }} />
              <Text style={{ fontSize: 4.5, color: '#64748b', marginTop: 1 }}>
                Review us
              </Text>
            </View>
          ) : (
            <View style={{ width: 54 }} />
          )}
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 5.5, color: '#64748b' }}>
              PRODUCT IS PRAISE WORTHY AND WILL NOT HESITATE RECOMMEND TO OTHERS
            </Text>
            <Text style={{ fontSize: 5.5, color: '#334155', marginTop: 2 }}>
              DEALS IN : HIKVISION | TVT | DAHUA | CP PLUS | AHUJA | JBL | BOSCH
            </Text>
          </View>
          <View style={{ width: 54 }} />
        </View>

        <Image src={assets.footerImage} style={s.footerImage} />
        <Text style={s.pageNote}>
          {job.jobNo} · Generated by Khurana Electronics Job Sheet Portal
        </Text>
      </Page>

      {/* Page 2 — site photos, only when present */}
      {job.photos.length > 0 && (
        <Page size="A4" style={s.page}>
          <Image src={assets.headerImage} style={s.headerImage} />
          <View style={{ marginTop: 8, marginBottom: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: BLUE }}>
              Site Photos
            </Text>
            <Text style={{ fontSize: 7, color: '#64748b', marginTop: 1 }}>
              {job.jobNo} · {job.siteFirmName}
            </Text>
          </View>

          <View
            style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}
          >
            {job.photos.map((p, i) => (
              <View key={i} style={{ width: '48%' }}>
                <Image
                  src={p.url}
                  style={{
                    width: '100%',
                    height: 150,
                    objectFit: 'cover',
                    borderWidth: 0.8,
                    borderColor: BORDER,
                  }}
                />
                <Text style={{ fontSize: 6, color: '#64748b', marginTop: 2 }}>
                  {p.takenAt.toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
                {p.caption ? (
                  <T style={{ fontSize: 7, marginTop: 1 }}>{p.caption}</T>
                ) : null}
              </View>
            ))}
          </View>

          <Image src={assets.footerImage} style={s.footerImage} />
          <Text style={s.pageNote}>{job.jobNo} · Site photos</Text>
        </Page>
      )}
    </Document>
  )
}
