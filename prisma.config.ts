import 'dotenv/config'
import path from 'node:path'
import { defineConfig } from 'prisma/config'

// `prisma generate` only reads schema.prisma and never opens a connection, but
// prisma/config's `env()` helper throws at config-load time if the variable is
// unset — which fails Vercel's `postinstall` before DATABASE_URL is even needed.
// Migrations and `db push`/`db pull` DO need a real value; they'll fail loudly
// with a real connection error from Postgres itself if this fallback is used.
export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    path: path.join('prisma', 'migrations'),
    seed: 'npx tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? 'postgresql://generate:generate@localhost:5432/generate',
  },
})
