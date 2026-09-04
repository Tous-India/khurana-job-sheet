import { prisma } from '@/lib/prisma'

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
  const clients = await prisma.client.findMany({
    select: {
      id: true,
      firmName: true,
      contactPerson: true,
      phone: true,
      address: true,
      jobSheets: {
        where: engineerId ? { engineerId } : undefined,
        select: { date: true },
        orderBy: { date: 'desc' },
        take: 1,
      },
    },
  })

  return clients
    .map((c) => ({
      id: c.id,
      firmName: c.firmName,
      contactPerson: c.contactPerson,
      phone: c.phone,
      address: c.address,
      lastUsedAt: c.jobSheets[0]?.date ?? null,
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
  const [products, usage] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      select: { id: true, name: true, modelNo: true, brand: true, category: true },
    }),
    // Line items store free text rather than a product id (the engineer may
    // type an unlisted item), so popularity is counted by model number.
    prisma.jobLineItem.groupBy({
      by: ['modelNo'],
      _count: { modelNo: true },
    }),
  ])

  const countByModel = new Map(
    usage
      .filter((u): u is typeof u & { modelNo: string } => Boolean(u.modelNo))
      .map((u) => [u.modelNo, u._count.modelNo]),
  )

  return products
    .map((p) => ({
      ...p,
      useCount: p.modelNo ? (countByModel.get(p.modelNo) ?? 0) : 0,
    }))
    .sort((a, b) => {
      if (b.useCount !== a.useCount) return b.useCount - a.useCount
      return a.name.localeCompare(b.name)
    })
}
