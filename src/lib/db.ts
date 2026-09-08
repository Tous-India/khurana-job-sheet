import {
  collections,
  ObjectId,
  type ClientDoc,
  type EngineerDoc,
  type FaultyItemDoc,
  type JobLineItemDoc,
  type JobPhotoDoc,
  type JobSheetDoc,
  type ProductDoc,
} from '@/lib/mongo'

/**
 * Data access for the job sheet portal.
 *
 * This replaces Prisma's generated client. Two rules hold throughout:
 *
 *  - Everything returned from here is plain JSON-serialisable data with string
 *    ids. ObjectId instances never reach a React component, because Next cannot
 *    serialise them across the server/client boundary.
 *  - Relations are stitched in application code, since MongoDB has no joins.
 *    The stitching is done with one query per collection rather than one per
 *    row, so a list of N job sheets costs a constant number of round trips.
 */

/* ----------------------------- shared types ----------------------------- */

export type Engineer = {
  id: string
  name: string
  phone: string | null
  active: boolean
  createdAt: Date
}

export type Client = {
  id: string
  firmName: string
  contactPerson: string | null
  phone: string | null
  address: string | null
  createdAt: Date
}

export type Product = {
  id: string
  name: string
  modelNo: string | null
  brand: string | null
  category: string | null
  active: boolean
}

export type JobLineItem = {
  id: string
  sortOrder: number
  description: string
  modelNo: string | null
  qty: number
  returnMat: number
  consumedMat: number
}

export type FaultyItem = {
  id: string
  sortOrder: number
  description: string
  qty: number
  clientName: string | null
}

export type JobPhoto = {
  id: string
  url: string
  caption: string | null
  takenAt: Date
}

export type JobSheet = {
  id: string
  jobNo: string
  shareToken: string
  date: Date
  dateOfWorkDone: Date | null
  engineerId: string
  clientId: string | null
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
  createdAt: Date
  updatedAt: Date
}

export type JobSheetWithEngineer = JobSheet & { engineer: { name: string } }

export type JobSheetFull = JobSheetWithEngineer & {
  lineItems: JobLineItem[]
  faultyItems: FaultyItem[]
  photos: JobPhoto[]
}

/* -------------------------------- mappers ------------------------------- */

const toEngineer = (d: EngineerDoc): Engineer => ({
  id: d._id.toString(),
  name: d.name,
  phone: d.phone ?? null,
  active: d.active,
  createdAt: d.createdAt,
})

const toClient = (d: ClientDoc): Client => ({
  id: d._id.toString(),
  firmName: d.firmName,
  contactPerson: d.contactPerson ?? null,
  phone: d.phone ?? null,
  address: d.address ?? null,
  createdAt: d.createdAt,
})

const toProduct = (d: ProductDoc): Product => ({
  id: d._id.toString(),
  name: d.name,
  modelNo: d.modelNo ?? null,
  brand: d.brand ?? null,
  category: d.category ?? null,
  active: d.active,
})

const toLineItem = (d: JobLineItemDoc): JobLineItem => ({
  id: d._id.toString(),
  sortOrder: d.sortOrder,
  description: d.description,
  modelNo: d.modelNo ?? null,
  qty: d.qty,
  returnMat: d.returnMat,
  consumedMat: d.consumedMat,
})

const toFaultyItem = (d: FaultyItemDoc): FaultyItem => ({
  id: d._id.toString(),
  sortOrder: d.sortOrder,
  description: d.description,
  qty: d.qty,
  clientName: d.clientName ?? null,
})

const toPhoto = (d: JobPhotoDoc): JobPhoto => ({
  id: d._id.toString(),
  url: d.url,
  caption: d.caption ?? null,
  takenAt: d.takenAt,
})

const toJobSheet = (d: JobSheetDoc): JobSheet => ({
  id: d._id.toString(),
  jobNo: d.jobNo,
  shareToken: d.shareToken,
  date: d.date,
  dateOfWorkDone: d.dateOfWorkDone ?? null,
  engineerId: d.engineerId.toString(),
  clientId: d.clientId ? d.clientId.toString() : null,
  siteFirmName: d.siteFirmName,
  contactPerson: d.contactPerson,
  mobileNo: d.mobileNo,
  address: d.address,
  handoverReport: d.handoverReport ?? null,
  remarks: d.remarks ?? null,
  clientOtherMaterials: d.clientOtherMaterials ?? null,
  signatureData: d.signatureData ?? null,
  latitude: d.latitude ?? null,
  longitude: d.longitude ?? null,
  locationAddress: d.locationAddress ?? null,
  createdAt: d.createdAt,
  updatedAt: d.updatedAt,
})

/** Parses a string id, returning null rather than throwing on malformed input. */
export function toObjectId(id: string): ObjectId | null {
  return ObjectId.isValid(id) ? new ObjectId(id) : null
}

/* ------------------------------- engineers ------------------------------ */

export async function listActiveEngineers(): Promise<
  { id: string; name: string }[]
> {
  const c = await collections()
  const docs = await c.engineers
    .find({ active: true })
    .sort({ name: 1 })
    .toArray()
  return docs.map((d) => ({ id: d._id.toString(), name: d.name }))
}

export async function listEngineersWithJobCounts(): Promise<
  (Engineer & { _count: { jobSheets: number } })[]
> {
  const c = await collections()
  const docs = await c.engineers.find().sort({ active: -1, name: 1 }).toArray()

  // One grouped count for all engineers, rather than a query per row.
  const counts = await c.jobSheets
    .aggregate<{ _id: ObjectId; n: number }>([
      { $group: { _id: '$engineerId', n: { $sum: 1 } } },
    ])
    .toArray()
  const byId = new Map(counts.map((r) => [r._id?.toString(), r.n]))

  return docs.map((d) => ({
    ...toEngineer(d),
    _count: { jobSheets: byId.get(d._id.toString()) ?? 0 },
  }))
}

export async function findEngineer(id: string): Promise<Engineer | null> {
  const oid = toObjectId(id)
  if (!oid) return null
  const c = await collections()
  const doc = await c.engineers.findOne({ _id: oid })
  return doc ? toEngineer(doc) : null
}

export async function createEngineer(data: {
  name: string
  phone: string | null
}): Promise<void> {
  const c = await collections()
  await c.engineers.insertOne({
    _id: new ObjectId(),
    name: data.name,
    phone: data.phone,
    active: true,
    createdAt: new Date(),
  })
}

export async function updateEngineer(
  id: string,
  data: Partial<{ name: string; phone: string | null; active: boolean }>,
): Promise<void> {
  const oid = toObjectId(id)
  if (!oid) return
  const c = await collections()
  await c.engineers.updateOne({ _id: oid }, { $set: data })
}

/* -------------------------------- clients ------------------------------- */

export async function listClientsWithJobCounts(): Promise<
  (Client & { _count: { jobSheets: number } })[]
> {
  const c = await collections()
  const docs = await c.clients.find().sort({ firmName: 1 }).toArray()

  const counts = await c.jobSheets
    .aggregate<{ _id: ObjectId | null; n: number }>([
      { $group: { _id: '$clientId', n: { $sum: 1 } } },
    ])
    .toArray()
  const byId = new Map(
    counts.filter((r) => r._id).map((r) => [r._id!.toString(), r.n]),
  )

  return docs.map((d) => ({
    ...toClient(d),
    _count: { jobSheets: byId.get(d._id.toString()) ?? 0 },
  }))
}

export async function createClient(data: {
  firmName: string
  contactPerson: string | null
  phone: string | null
  address: string | null
}): Promise<Client> {
  const c = await collections()
  const doc: ClientDoc = {
    _id: new ObjectId(),
    firmName: data.firmName,
    contactPerson: data.contactPerson,
    phone: data.phone,
    address: data.address,
    createdAt: new Date(),
  }
  await c.clients.insertOne(doc)
  return toClient(doc)
}

export async function updateClient(
  id: string,
  data: Partial<{
    firmName: string
    contactPerson: string | null
    phone: string | null
    address: string | null
  }>,
): Promise<void> {
  const oid = toObjectId(id)
  if (!oid) return
  const c = await collections()
  await c.clients.updateOne({ _id: oid }, { $set: data })
}

/**
 * Deletes a client, detaching it from any job sheets that reference it.
 *
 * The sheets are deliberately kept: they are the record of a visit that
 * happened, and their header block already stores the site and firm name
 * denormalised, so nothing user-visible is lost by clearing the link.
 */
export async function deleteClientDetachingSheets(id: string): Promise<void> {
  const oid = toObjectId(id)
  if (!oid) return
  const c = await collections()
  await c.jobSheets.updateMany({ clientId: oid }, { $set: { clientId: null } })
  await c.clients.deleteOne({ _id: oid })
}

export async function countJobSheetsForClient(id: string): Promise<number> {
  const oid = toObjectId(id)
  if (!oid) return 0
  const c = await collections()
  return c.jobSheets.countDocuments({ clientId: oid })
}

/* ------------------------------- products ------------------------------- */

export async function listProducts(): Promise<Product[]> {
  const c = await collections()
  const docs = await c.products
    .find()
    .sort({ active: -1, brand: 1, name: 1 })
    .toArray()
  return docs.map(toProduct)
}

export async function listActiveProducts(): Promise<Product[]> {
  const c = await collections()
  const docs = await c.products.find({ active: true }).toArray()
  return docs.map(toProduct)
}

export async function findProduct(id: string): Promise<Product | null> {
  const oid = toObjectId(id)
  if (!oid) return null
  const c = await collections()
  const doc = await c.products.findOne({ _id: oid })
  return doc ? toProduct(doc) : null
}

export async function createProduct(data: {
  name: string
  modelNo: string | null
  brand: string | null
  category: string | null
}): Promise<void> {
  const c = await collections()
  await c.products.insertOne({
    _id: new ObjectId(),
    name: data.name,
    modelNo: data.modelNo,
    brand: data.brand,
    category: data.category,
    active: true,
  })
}

export async function updateProduct(
  id: string,
  data: Partial<{
    name: string
    modelNo: string | null
    brand: string | null
    category: string | null
    active: boolean
  }>,
): Promise<void> {
  const oid = toObjectId(id)
  if (!oid) return
  const c = await collections()
  await c.products.updateOne({ _id: oid }, { $set: data })
}

/** Line-item usage counted by model number, for recent-first product ordering. */
export async function countLineItemUsageByModel(): Promise<Map<string, number>> {
  const c = await collections()
  const rows = await c.jobLineItems
    .aggregate<{ _id: string | null; n: number }>([
      { $group: { _id: '$modelNo', n: { $sum: 1 } } },
    ])
    .toArray()
  return new Map(
    rows.filter((r) => r._id).map((r) => [r._id as string, r.n]),
  )
}

/* ------------------------------- job sheets ----------------------------- */

/** Attaches engineer names to a set of sheets with a single extra query. */
async function withEngineerNames(
  docs: JobSheetDoc[],
): Promise<JobSheetWithEngineer[]> {
  if (docs.length === 0) return []
  const c = await collections()
  const ids = [...new Set(docs.map((d) => d.engineerId.toString()))].map(
    (s) => new ObjectId(s),
  )
  const engineers = await c.engineers
    .find({ _id: { $in: ids } })
    .project<{ _id: ObjectId; name: string }>({ name: 1 })
    .toArray()
  const nameById = new Map(engineers.map((e) => [e._id.toString(), e.name]))

  return docs.map((d) => ({
    ...toJobSheet(d),
    engineer: { name: nameById.get(d.engineerId.toString()) ?? 'Unknown' },
  }))
}

export async function listJobSheets(opts: {
  since?: Date
  search?: string
  limit?: number
}): Promise<JobSheetWithEngineer[]> {
  const c = await collections()

  const filter: Record<string, unknown> = {}
  if (opts.since) filter.date = { $gte: opts.since }

  if (opts.search) {
    // Case-insensitive substring match, the equivalent of Prisma's
    // `mode: 'insensitive'`. The term is escaped so regex metacharacters in a
    // search box cannot alter the query or cause a catastrophic backtrack.
    const escaped = opts.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const rx = { $regex: escaped, $options: 'i' }
    filter.$or = [{ jobNo: rx }, { siteFirmName: rx }, { contactPerson: rx }]
  }

  const docs = await c.jobSheets
    .find(filter)
    .sort({ date: -1 })
    .limit(opts.limit ?? 50)
    .toArray()

  return withEngineerNames(docs)
}

export async function countJobSheetsBetween(
  start: Date,
  end: Date,
): Promise<number> {
  const c = await collections()
  return c.jobSheets.countDocuments({ date: { $gte: start, $lt: end } })
}

/** Loads a sheet with everything the detail page and the PDF need. */
async function loadFull(doc: JobSheetDoc | null): Promise<JobSheetFull | null> {
  if (!doc) return null
  const c = await collections()

  const [withName] = await withEngineerNames([doc])
  const [lineItems, faultyItems, photos] = await Promise.all([
    c.jobLineItems.find({ jobSheetId: doc._id }).sort({ sortOrder: 1 }).toArray(),
    c.faultyItems.find({ jobSheetId: doc._id }).sort({ sortOrder: 1 }).toArray(),
    c.jobPhotos.find({ jobSheetId: doc._id }).sort({ takenAt: 1 }).toArray(),
  ])

  return {
    ...withName,
    lineItems: lineItems.map(toLineItem),
    faultyItems: faultyItems.map(toFaultyItem),
    photos: photos.map(toPhoto),
  }
}

export async function findJobSheetById(id: string): Promise<JobSheetFull | null> {
  const oid = toObjectId(id)
  if (!oid) return null
  const c = await collections()
  return loadFull(await c.jobSheets.findOne({ _id: oid }))
}

export async function findJobSheetByShareToken(
  shareToken: string,
): Promise<JobSheetFull | null> {
  const c = await collections()
  return loadFull(await c.jobSheets.findOne({ shareToken }))
}

export async function findLatestJobSheet(
  remarksContains?: string,
): Promise<Pick<JobSheet, 'jobNo' | 'shareToken' | 'siteFirmName'> | null> {
  const c = await collections()
  const filter = remarksContains
    ? { remarks: { $regex: remarksContains.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') } }
    : {}
  const doc = await c.jobSheets.find(filter).sort({ date: -1 }).limit(1).next()
  if (!doc) return null
  return {
    jobNo: doc.jobNo,
    shareToken: doc.shareToken,
    siteFirmName: doc.siteFirmName,
  }
}

/** The most recent visit per client, used for recent-first client ordering. */
export async function lastVisitByClient(
  engineerId: string | null,
): Promise<Map<string, Date>> {
  const c = await collections()
  const match: Record<string, unknown> = { clientId: { $ne: null } }
  if (engineerId) {
    const oid = toObjectId(engineerId)
    if (oid) match.engineerId = oid
  }
  const rows = await c.jobSheets
    .aggregate<{ _id: ObjectId; last: Date }>([
      { $match: match },
      { $group: { _id: '$clientId', last: { $max: '$date' } } },
    ])
    .toArray()
  return new Map(rows.filter((r) => r._id).map((r) => [r._id.toString(), r.last]))
}

export async function listClients(): Promise<Client[]> {
  const c = await collections()
  const docs = await c.clients.find().toArray()
  return docs.map(toClient)
}

/* ------------------------------ submission ------------------------------ */

export type NewJobSheet = {
  jobNo: string
  shareToken: string
  date: Date
  dateOfWorkDone: Date | null
  engineerId: string
  clientId: string | null
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
  lineItems: Omit<JobLineItem, 'id'>[]
  faultyItems: Omit<FaultyItem, 'id'>[]
  /** `takenAt` defaults to now; the seed sets it explicitly to stagger photos. */
  photos: { url: string; caption: string | null; takenAt?: Date }[]
}

/**
 * Writes a sheet and its children.
 *
 * The sheet is inserted first and alone: its unique `jobNo` index is what
 * detects two engineers submitting at the same moment, and the caller retries
 * with a new number on a duplicate-key error (src/lib/job-number.ts). Children
 * are written only once the number is secured, and are cleaned up if that
 * second write fails, so a failed submission cannot leave a sheet with a
 * partial set of line items.
 */
export async function insertJobSheet(
  data: NewJobSheet,
): Promise<{ id: string; jobNo: string; shareToken: string }> {
  const c = await collections()
  const engineerOid = toObjectId(data.engineerId)
  if (!engineerOid) throw new Error('Invalid engineer id')

  const _id = new ObjectId()
  const now = new Date()

  await c.jobSheets.insertOne({
    _id,
    jobNo: data.jobNo,
    shareToken: data.shareToken,
    date: data.date,
    dateOfWorkDone: data.dateOfWorkDone,
    engineerId: engineerOid,
    clientId: data.clientId ? toObjectId(data.clientId) : null,
    siteFirmName: data.siteFirmName,
    contactPerson: data.contactPerson,
    mobileNo: data.mobileNo,
    address: data.address,
    handoverReport: data.handoverReport,
    remarks: data.remarks,
    clientOtherMaterials: data.clientOtherMaterials,
    signatureData: data.signatureData,
    latitude: data.latitude,
    longitude: data.longitude,
    locationAddress: data.locationAddress,
    createdAt: now,
    updatedAt: now,
  })

  try {
    await Promise.all([
      data.lineItems.length
        ? c.jobLineItems.insertMany(
            data.lineItems.map((li) => ({ _id: new ObjectId(), jobSheetId: _id, ...li })),
          )
        : null,
      data.faultyItems.length
        ? c.faultyItems.insertMany(
            data.faultyItems.map((fi) => ({ _id: new ObjectId(), jobSheetId: _id, ...fi })),
          )
        : null,
      data.photos.length
        ? c.jobPhotos.insertMany(
            data.photos.map((p) => ({
              _id: new ObjectId(),
              jobSheetId: _id,
              url: p.url,
              caption: p.caption,
              takenAt: p.takenAt ?? new Date(),
            })),
          )
        : null,
    ])
  } catch (error) {
    await deleteJobSheetCascade(_id.toString()).catch(() => {})
    throw error
  }

  return { id: _id.toString(), jobNo: data.jobNo, shareToken: data.shareToken }
}

/**
 * Deletes a sheet and everything hanging off it.
 *
 * MongoDB does not enforce `onDelete: Cascade`, so this must be explicit —
 * without it the line items, faulty items and photos survive as orphans that
 * nothing references and no screen can reach.
 */
export async function deleteJobSheetCascade(id: string): Promise<void> {
  const oid = toObjectId(id)
  if (!oid) return
  const c = await collections()
  await Promise.all([
    c.jobLineItems.deleteMany({ jobSheetId: oid }),
    c.faultyItems.deleteMany({ jobSheetId: oid }),
    c.jobPhotos.deleteMany({ jobSheetId: oid }),
  ])
  await c.jobSheets.deleteOne({ _id: oid })
}
