import { MongoClient, type Db, type Collection, ObjectId } from 'mongodb'

/**
 * MongoDB connection.
 *
 * Prisma 7 requires a driver adapter for every datasource and ships none for
 * MongoDB, so the app talks to the official driver directly. Documents are
 * shaped exactly as the old relational rows were — see the `*Doc` types below —
 * so the two things the document model does not give us for free are handled
 * in application code instead:
 *
 *  1. There are no joins. Reads that previously used Prisma's `include` fetch
 *     the related documents and stitch them together (src/lib/db.ts).
 *  2. There is no `onDelete: Cascade`. Deleting a job sheet must delete its
 *     line items, faulty items and photos explicitly, or they are orphaned.
 */

const globalForMongo = globalThis as unknown as {
  mongoClient: MongoClient | undefined
  mongoPromise: Promise<MongoClient> | undefined
}

function connect(): Promise<MongoClient> {
  const uri = process.env.DATABASE_URL
  if (!uri) {
    throw new Error('DATABASE_URL is required at runtime — set it in the environment.')
  }

  // Serverless invocations are short-lived and numerous; a small pool per
  // instance avoids exhausting Atlas's connection limit.
  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10_000,
  })
  return client.connect()
}

/**
 * Connecting is deferred until the first query. Next imports every route module
 * during build to collect page data, and connecting at import time would make
 * the build require a reachable database.
 */
export function getClient(): Promise<MongoClient> {
  if (!globalForMongo.mongoPromise) {
    globalForMongo.mongoPromise = connect()
  }
  return globalForMongo.mongoPromise
}

export async function getDb(): Promise<Db> {
  const client = await getClient()
  // The database name comes from the connection string.
  return client.db()
}

/* ------------------------------------------------------------------ *
 * Document shapes
 *
 * `_id` is a real ObjectId in the database; every value that crosses into
 * React is converted to a string id by the mappers in src/lib/db.ts, because
 * an ObjectId cannot be serialised into a client component.
 * ------------------------------------------------------------------ */

export type EngineerDoc = {
  _id: ObjectId
  name: string
  phone: string | null
  active: boolean
  createdAt: Date
}

export type ClientDoc = {
  _id: ObjectId
  firmName: string
  contactPerson: string | null
  phone: string | null
  address: string | null
  createdAt: Date
}

export type ProductDoc = {
  _id: ObjectId
  name: string
  modelNo: string | null
  brand: string | null
  category: string | null
  active: boolean
}

export type JobSheetDoc = {
  _id: ObjectId
  jobNo: string
  shareToken: string
  date: Date
  dateOfWorkDone: Date | null
  engineerId: ObjectId
  clientId: ObjectId | null
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

export type JobLineItemDoc = {
  _id: ObjectId
  jobSheetId: ObjectId
  sortOrder: number
  description: string
  modelNo: string | null
  qty: number
  returnMat: number
  consumedMat: number
}

export type FaultyItemDoc = {
  _id: ObjectId
  jobSheetId: ObjectId
  sortOrder: number
  description: string
  qty: number
  clientName: string | null
}

export type JobPhotoDoc = {
  _id: ObjectId
  jobSheetId: ObjectId
  url: string
  caption: string | null
  takenAt: Date
}

export async function collections() {
  const db = await getDb()
  return {
    engineers: db.collection<EngineerDoc>('engineers'),
    clients: db.collection<ClientDoc>('clients'),
    products: db.collection<ProductDoc>('products'),
    jobSheets: db.collection<JobSheetDoc>('jobSheets'),
    jobLineItems: db.collection<JobLineItemDoc>('jobLineItems'),
    faultyItems: db.collection<FaultyItemDoc>('faultyItems'),
    jobPhotos: db.collection<JobPhotoDoc>('jobPhotos'),
  }
}

export type Collections = Awaited<ReturnType<typeof collections>>
export type { Collection, Db }
export { ObjectId }

/**
 * Indexes the app depends on. `jobNo` and `shareToken` are unique — job-number
 * allocation relies on the unique index to detect a collision between two
 * simultaneous submissions (see src/lib/job-number.ts).
 */
export async function ensureIndexes(): Promise<void> {
  const c = await collections()
  await Promise.all([
    c.jobSheets.createIndex({ jobNo: 1 }, { unique: true }),
    c.jobSheets.createIndex({ shareToken: 1 }, { unique: true }),
    c.jobSheets.createIndex({ date: -1 }),
    c.jobSheets.createIndex({ engineerId: 1 }),
    c.jobSheets.createIndex({ clientId: 1 }),
    c.jobLineItems.createIndex({ jobSheetId: 1 }),
    c.jobLineItems.createIndex({ modelNo: 1 }),
    c.faultyItems.createIndex({ jobSheetId: 1 }),
    c.jobPhotos.createIndex({ jobSheetId: 1 }),
  ])
}

/** True for MongoDB's duplicate-key error, the equivalent of Prisma's P2002. */
export function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: number }).code === 11000
  )
}
