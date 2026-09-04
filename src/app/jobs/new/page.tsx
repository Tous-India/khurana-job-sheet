import { getClientsRecentFirst, getProductsRecentFirst } from '@/lib/recent'
import { JobWizard } from '@/components/job-wizard'

// Catalogue and client list must reflect admin edits immediately.
export const dynamic = 'force-dynamic'

export default async function NewJobPage() {
  // Recent-first ordering is per engineer, but the engineer is only known in
  // the browser (localStorage). Fetch the global ordering here; the wizard
  // re-sorts client-side once it knows who is filling the sheet.
  const [clients, products] = await Promise.all([
    getClientsRecentFirst(null),
    getProductsRecentFirst(),
  ])

  return <JobWizard clients={clients} products={products} />
}
