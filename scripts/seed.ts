import { nanoid } from 'nanoid'
import 'dotenv/config'
import { collections, ensureIndexes, getClient, ObjectId } from '../src/lib/mongo'
import { createClient, createEngineer, insertJobSheet } from '../src/lib/db'

// TODO: replace with actual engineer names from Khurana Electronics.
// The names on the source paper sheets were handwritten and could not be read
// reliably, so no attempt is made to guess them here. See README section 12.
const ENGINEERS = [
  { name: 'Engineer 1', phone: '9053000271' },
  { name: 'Engineer 2', phone: '9053000272' },
  { name: 'Engineer 3', phone: '9053000273' },
  { name: 'Engineer 4', phone: '9053000274' },
]

// Plausible Sonipat-area firms. Replace with the client's real customer list.
const CLIENTS = [
  {
    firmName: 'Shree Balaji Traders',
    contactPerson: 'Rakesh Kumar',
    phone: '9812345601',
    address: 'Shop 14, Geeta Bhawan Road, Sonipat, Haryana 131001',
  },
  {
    firmName: 'Nathupur Public School',
    contactPerson: 'Principal Office',
    phone: '9812345602',
    address: 'Nathupur Village, Sonipat, Haryana 131021',
  },
  {
    firmName: 'Haryana Steel Works',
    contactPerson: 'Sandeep Yadav',
    phone: '9812345603',
    address: 'Plot 22, HSIIDC Industrial Area, Sonipat, Haryana 131028',
  },
  {
    firmName: 'Gandhi Park Medical Store',
    contactPerson: 'Dr. Anil Sharma',
    phone: '9812345604',
    address: 'Near Gandhi Park, Sector 14, Sonipat, Haryana 131001',
  },
  {
    firmName: 'Rajgarh Cold Storage',
    contactPerson: 'Manoj Singh',
    phone: '9812345605',
    address: 'Rajgarh Road, Sonipat, Haryana 131001',
  },
  {
    firmName: 'Sonipat Auto Parts',
    contactPerson: 'Vikram Malik',
    phone: '9812345606',
    address: 'Old Bus Stand Road, Sonipat, Haryana 131001',
  },
  {
    firmName: 'Kailash Residency',
    contactPerson: 'Society Secretary',
    phone: '9812345607',
    address: 'Sector 15, Sonipat, Haryana 131001',
  },
  {
    firmName: 'Murthal Dhaba Complex',
    contactPerson: 'Jaspreet Singh',
    phone: '9812345608',
    address: 'NH-44, Murthal, Sonipat, Haryana 131027',
  },
]

// Catalogue across the brands the company deals in. Selecting from this list is
// what removes handwritten model numbers from the process (README 5.3).
const PRODUCTS = [
  // DVR / NVR
  { name: 'DVR 4 Channel', modelNo: 'DS-7A04HQHI-K1', brand: 'Hikvision', category: 'DVR' },
  { name: 'DVR 8 Channel', modelNo: 'DS-7A08HQHI-K1', brand: 'Hikvision', category: 'DVR' },
  { name: 'DVR 16 Channel', modelNo: 'DS-7B16HQHI-K1', brand: 'Hikvision', category: 'DVR' },
  { name: 'DVR 4 Channel', modelNo: 'CP-UVR-0401E1-CS', brand: 'CP Plus', category: 'DVR' },
  { name: 'DVR 8 Channel', modelNo: 'CP-UVR-0801E1-CS', brand: 'CP Plus', category: 'DVR' },
  { name: 'NVR 8 Channel', modelNo: 'DS-7108NI-Q1/M', brand: 'Hikvision', category: 'NVR' },
  { name: 'NVR 16 Channel', modelNo: 'CP-UNR-4K2162-V2', brand: 'CP Plus', category: 'NVR' },
  { name: 'DVR 4 Channel', modelNo: 'XVR1B04H', brand: 'Dahua', category: 'DVR' },

  // Cameras
  { name: 'Dome Camera 2MP', modelNo: 'DS-2CE5AD0T-IRP', brand: 'Hikvision', category: 'Camera' },
  { name: 'Bullet Camera 2MP', modelNo: 'DS-2CE1AD0T-IRP', brand: 'Hikvision', category: 'Camera' },
  { name: 'Dome Camera 5MP', modelNo: 'DS-2CE5AH0T-IRP', brand: 'Hikvision', category: 'Camera' },
  { name: 'Bullet Camera 5MP', modelNo: 'DS-2CE1AH0T-IRP', brand: 'Hikvision', category: 'Camera' },
  { name: 'Dome Camera 2.4MP', modelNo: 'CP-USC-DA24PL2', brand: 'CP Plus', category: 'Camera' },
  { name: 'Bullet Camera 2.4MP', modelNo: 'CP-USC-TA24PL2', brand: 'CP Plus', category: 'Camera' },
  { name: 'IP Dome Camera 4MP', modelNo: 'CP-UNC-DA41PL3C', brand: 'CP Plus', category: 'Camera' },
  { name: 'Bullet Camera 2MP', modelNo: 'TD-7422AS', brand: 'TVT', category: 'Camera' },
  { name: 'Dome Camera 2MP', modelNo: 'HAC-HDW1200TRQ', brand: 'Dahua', category: 'Camera' },
  { name: 'PTZ Camera 2MP', modelNo: 'DS-2AE4225TI-D', brand: 'Hikvision', category: 'Camera' },

  // Storage
  { name: 'Hard Disk 1TB Surveillance', modelNo: 'WD10PURZ', brand: 'WD', category: 'Storage' },
  { name: 'Hard Disk 2TB Surveillance', modelNo: 'WD20PURZ', brand: 'WD', category: 'Storage' },
  { name: 'Hard Disk 4TB Surveillance', modelNo: 'ST4000VX016', brand: 'Seagate', category: 'Storage' },
  { name: 'Memory Card 128GB', modelNo: 'SDSQUAB-128G', brand: 'SanDisk', category: 'Storage' },

  // Power
  { name: 'SMPS 4 Channel', modelNo: 'SMPS-4CH-12V5A', brand: 'Generic', category: 'Power' },
  { name: 'SMPS 8 Channel', modelNo: 'SMPS-8CH-12V10A', brand: 'Generic', category: 'Power' },
  { name: 'Power Adapter 12V 1A', modelNo: 'PA-12V1A', brand: 'Generic', category: 'Power' },

  // Cable and accessories
  { name: '3+1 CCTV Cable (90m Roll)', modelNo: 'CAB-3+1-90M', brand: 'Generic', category: 'Cable' },
  { name: 'CAT6 Cable (305m Box)', modelNo: 'CAT6-305M', brand: 'Generic', category: 'Cable' },
  { name: 'BNC Connector', modelNo: 'BNC-M-CRIMP', brand: 'Generic', category: 'Accessory' },
  { name: 'DC Connector', modelNo: 'DC-M-PIN', brand: 'Generic', category: 'Accessory' },
  { name: 'Camera Mounting Box 4x4', modelNo: 'JB-4X4', brand: 'Generic', category: 'Accessory' },

  // Audio
  { name: 'PA Amplifier 60W', modelNo: 'SSA-160', brand: 'Ahuja', category: 'Audio' },
  { name: 'Wall Speaker 6W', modelNo: 'ASX-606T', brand: 'Ahuja', category: 'Audio' },
  { name: 'Ceiling Speaker', modelNo: 'CS-6', brand: 'JBL', category: 'Audio' },
]

/**
 * A 1x1 transparent PNG standing in for a captured signature. Real signatures are
 * base64 PNGs produced by react-signature-canvas on the sign-off step.
 */
const PLACEHOLDER_SIGNATURE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

/**
 * All seed dates are relative to the moment the seed runs, never hardcoded.
 * A fixed date means the Today tab is empty on demo day, and /jobs is the screen
 * most likely to be opened cold in front of the client — an empty first screen
 * reads as broken software.
 */
function daysAgo(n: number, hour = 11, minute = 30): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  // setUTCHours, not setHours: dates are stored as UTC, so setting local hours
  // in IST (+5:30) shifts seeded visits outside business hours when read back.
  d.setUTCHours(hour, minute, 0, 0)
  return d
}

function jobNoFor(date: Date, seq: number): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `KE-${y}${m}${d}-${String(seq).padStart(3, '0')}`
}

async function main() {
  const c = await collections()

  console.log('Ensuring indexes...')
  // The unique index on jobNo is what makes concurrent submissions safe, so it
  // has to exist before anything is written. MongoDB has no migrations to
  // create it for us.
  await ensureIndexes()

  console.log('Clearing existing data...')
  // Nothing cascades in MongoDB: every collection is cleared explicitly.
  await Promise.all([
    c.jobPhotos.deleteMany({}),
    c.faultyItems.deleteMany({}),
    c.jobLineItems.deleteMany({}),
    c.jobSheets.deleteMany({}),
    c.products.deleteMany({}),
    c.clients.deleteMany({}),
    c.engineers.deleteMany({}),
  ])

  console.log('Seeding engineers...')
  for (const e of ENGINEERS) await createEngineer(e)
  const engineers = (await c.engineers.find().sort({ name: 1 }).toArray()).map(
    (d) => ({ id: d._id.toString(), name: d.name }),
  )

  console.log('Seeding clients...')
  const clients = await Promise.all(CLIENTS.map((x) => createClient(x)))

  console.log('Seeding products...')
  await c.products.insertMany(
    PRODUCTS.map((p) => ({
      _id: new ObjectId(),
      name: p.name,
      modelNo: p.modelNo ?? null,
      brand: p.brand ?? null,
      category: p.category ?? null,
      active: true,
    })),
  )

  console.log('Seeding job sheets...')

  // Sonipat town centre, jittered per sheet so the PDF location line varies.
  const SONIPAT = { lat: 28.9931, lng: 77.0151 }
  const jitter = (base: number, i: number) => base + (i - 2) * 0.004

  const sheets = [
    {
      client: clients[0],
      engineer: engineers[0],
      day: 0,
      handoverReport: 'Checked all 4 cameras and DVR recording. Handed over to client.',
      // Hindi content — exercises the Devanagari font path in the PDF (README 6.1).
      remarks: 'सभी कैमरे चेक कर दिए। Recording OK. Date & Time set.',
      clientOtherMaterials: '1 old DVR retained by client.',
      lineItems: [
        { description: 'Dome Camera 2MP', modelNo: 'DS-2CE5AD0T-IRP', qty: 2, returnMat: 0, consumedMat: 2 },
        { description: 'BNC Connector', modelNo: 'BNC-M-CRIMP', qty: 8, returnMat: 2, consumedMat: 6 },
        { description: '3+1 CCTV Cable (90m Roll)', modelNo: 'CAB-3+1-90M', qty: 1, returnMat: 0, consumedMat: 1 },
      ],
      faultyItems: [
        { description: 'मुख्य द्वार का कैमरा खराब था, नया लगा दिया', qty: 1 },
        { description: 'Old SMPS burnt — replaced', qty: 1 },
      ],
      // Placeholder site photos so the PDF page-2 grid has content before any
      // real upload. Timestamps are relative, like every other seeded date.
      photos: [
        { url: '/demo/site-photo-1.png', caption: 'Main gate camera after replacement' },
        { url: '/demo/site-photo-2.png', caption: 'DVR rack — recording verified' },
      ],
    },
    {
      client: clients[1],
      engineer: engineers[1],
      day: 0,
      handoverReport: 'Installed 8 channel DVR with 2TB HDD. Recording verified for all channels.',
      remarks: 'Camera focus adjusted. Recording OK.',
      clientOtherMaterials: null,
      lineItems: [
        { description: 'DVR 8 Channel', modelNo: 'DS-7A08HQHI-K1', qty: 1, returnMat: 0, consumedMat: 1 },
        { description: 'Hard Disk 2TB Surveillance', modelNo: 'WD20PURZ', qty: 1, returnMat: 0, consumedMat: 1 },
        { description: 'Bullet Camera 2MP', modelNo: 'DS-2CE1AD0T-IRP', qty: 6, returnMat: 1, consumedMat: 5 },
      ],
      faultyItems: [{ description: 'Faulty 4ch DVR received from client for service', qty: 1 }],
    },
    {
      client: clients[2],
      engineer: engineers[0],
      day: 1,
      handoverReport: 'Annual maintenance visit. Cleaned all camera housings, checked power supply.',
      remarks: 'Power supply checked. सभी कैमरे चेक कर दिए।',
      clientOtherMaterials: 'Client retains 2 spare cameras.',
      lineItems: [
        { description: 'SMPS 8 Channel', modelNo: 'SMPS-8CH-12V10A', qty: 1, returnMat: 0, consumedMat: 1 },
        { description: 'DC Connector', modelNo: 'DC-M-PIN', qty: 10, returnMat: 4, consumedMat: 6 },
      ],
      faultyItems: [{ description: 'पुराना SMPS जला हुआ था', qty: 1 }],
    },
    {
      client: clients[3],
      engineer: engineers[2],
      day: 9,
      handoverReport: 'New 4 camera installation completed. Mobile app configured for client.',
      remarks: 'Recording OK. Date & Time set. Mobile view configured.',
      clientOtherMaterials: null,
      lineItems: [
        { description: 'DVR 4 Channel', modelNo: 'CP-UVR-0401E1-CS', qty: 1, returnMat: 0, consumedMat: 1 },
        { description: 'Dome Camera 2.4MP', modelNo: 'CP-USC-DA24PL2', qty: 4, returnMat: 0, consumedMat: 4 },
        { description: 'Hard Disk 1TB Surveillance', modelNo: 'WD10PURZ', qty: 1, returnMat: 0, consumedMat: 1 },
        { description: 'Camera Mounting Box 4x4', modelNo: 'JB-4X4', qty: 4, returnMat: 0, consumedMat: 4 },
      ],
      faultyItems: [],
    },
    {
      client: clients[5],
      engineer: engineers[3],
      day: 19,
      handoverReport: 'Service call — HDD replaced, recording restored.',
      remarks: 'HDD replaced. Recording OK. 22 कैमरे चेक कर दिए।',
      clientOtherMaterials: 'Faulty HDD handed back to client.',
      lineItems: [
        { description: 'Hard Disk 4TB Surveillance', modelNo: 'ST4000VX016', qty: 1, returnMat: 0, consumedMat: 1 },
      ],
      faultyItems: [
        { description: 'HDD not detecting — replaced under warranty', qty: 1 },
        { description: 'कैमरा नंबर 7 का फोकस ठीक किया', qty: 1 },
      ],
    },
  ]

  // Stagger the hour so same-day sheets sort sensibly, and track a per-day
  // sequence so two sheets dated today get distinct job numbers.
  const seqByDay = new Map<string, number>()

  for (const [i, s] of sheets.entries()) {
    const sheetDay = s.day
    const date = daysAgo(sheetDay, 10 + (i % 4) * 2, 15) // 10:15-16:15, business hours
    const dayKey = date.toDateString()
    const seq = (seqByDay.get(dayKey) ?? 0) + 1
    seqByDay.set(dayKey, seq)

    await insertJobSheet({
      jobNo: jobNoFor(date, seq),
      shareToken: nanoid(21),
      date,
      dateOfWorkDone: date,
      engineerId: s.engineer.id,
      clientId: s.client.id,
      siteFirmName: s.client.firmName,
      contactPerson: s.client.contactPerson ?? '',
      mobileNo: s.client.phone ?? '',
      address: s.client.address ?? '',
      handoverReport: s.handoverReport,
      remarks: s.remarks,
      clientOtherMaterials: s.clientOtherMaterials,
      signatureData: PLACEHOLDER_SIGNATURE,
      latitude: jitter(SONIPAT.lat, i),
      longitude: jitter(SONIPAT.lng, i),
      locationAddress: `${s.client.address}`,
      lineItems: s.lineItems.map((li, idx) => ({
        sortOrder: idx + 1,
        description: li.description,
        modelNo: li.modelNo ?? null,
        qty: li.qty ?? 0,
        returnMat: li.returnMat ?? 0,
        consumedMat: li.consumedMat ?? 0,
      })),
      faultyItems: s.faultyItems.map((fi, idx) => ({
        sortOrder: idx + 1,
        description: fi.description,
        qty: fi.qty ?? 0,
        clientName: s.client.firmName,
      })),
      photos:
        'photos' in s && s.photos
          ? s.photos.map((ph, idx) => ({
              url: ph.url,
              caption: ph.caption ?? null,
              takenAt: daysAgo(sheetDay, 10 + (i % 4) * 2, 20 + idx),
            }))
          : [],
    })
  }

  console.log(
    `Seeded ${engineers.length} engineers, ${clients.length} clients, ` +
      `${PRODUCTS.length} products, ${sheets.length} job sheets.`,
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    const client = await getClient()
    await client.close()
  })
