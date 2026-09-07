import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'

// Prisma 7 takes the connection through a driver adapter rather than a `url` in
// schema.prisma. See prisma.config.ts for the migration-time counterpart.
const createPrismaClient = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required at runtime — set it in the environment.')
  }
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  })
}

// Next.js dev mode hot-reloads modules, which would otherwise open a new pool on
// every reload until Postgres refuses connections.
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined
}

// Next imports every route module during build to collect page data, which would
// otherwise construct the client (and throw on a missing DATABASE_URL) at import
// time rather than at request time. The Proxy defers construction until the
// first actual property access, i.e. the first real query.
function getPrismaClient() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient()
  }
  return globalForPrisma.prisma
}

export const prisma = new Proxy({} as ReturnType<typeof createPrismaClient>, {
  get(_target, prop, receiver) {
    return Reflect.get(getPrismaClient(), prop, receiver)
  },
})
