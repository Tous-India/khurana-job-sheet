import {
  countLineItemUsageByModel,
  lastVisitByClient,
  listActiveProducts,
  listClients,
} from '@/lib/db'

/**
 * Recent-first ordering (design principle: the right answer should usually be
 * the first row, so the engineer taps instead of searching).
 *
 * "Recent" is scoped to the engineer where possible — the man on the ladder
 * revisits his own sites, not the whole company's.
 */

export type ClientOption = {
  id: string
  firmName: string
  contactPerson: string | null
  phone: string | null
  address: string | null
  lastUsedAt: Date | null
}

export async function getClientsRecentFirst(
  engineerId: string | null,
): Promise<ClientOption[]> {
  // Two queries rather than a per-client subquery: the clients, and the most
  // recent visit for each, grouped in the database.
  const [clients, lastVisit] = await Promise.all([
    listClients(),
    lastVisitByClient(engineerId),
  ])

  return clients
    .map((c) => ({
      id: c.id,
      firmName: c.firmName,
      contactPerson: c.contactPerson,
      phone: c.phone,
      address: c.address,
      lastUsedAt: lastVisit.get(c.id) ?? null,
    }))
    .sort((a, b) => {
      // Sites this engineer has visited float to the top, newest first;
      // everything else falls back to alphabetical.
      if (a.lastUsedAt && b.lastUsedAt)
        return b.lastUsedAt.getTime() - a.lastUsedAt.getTime()
      if (a.lastUsedAt) return -1
      if (b.lastUsedAt) return 1
      return a.firmName.localeCompare(b.firmName)
    })
}

export type ProductOption = {
  id: string
  name: string
  modelNo: string | null
  brand: string | null
  category: string | null
  useCount: number
}

export async function getProductsRecentFirst(): Promise<ProductOption[]> {
  const [products, countByModel] = await Promise.all([
    listActiveProducts(),
    // Line items store free text rather than a product id (the engineer may
    // type an unlisted item), so popularity is counted by model number.
    countLineItemUsageByModel(),
  ])

  return products
    .map((p) => ({
      id: p.id,
      name: p.name,
      modelNo: p.modelNo,
      brand: p.brand,
      category: p.category,
      useCount: p.modelNo ? (countByModel.get(p.modelNo) ?? 0) : 0,
    }))
    .sort((a, b) => {
      if (b.useCount !== a.useCount) return b.useCount - a.useCount
      return a.name.localeCompare(b.name)
    })
}
