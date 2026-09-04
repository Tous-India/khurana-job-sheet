'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

/**
 * Admin CRUD. The owner uses these, never the field engineer, so they are
 * deliberately plain — no wizard, no steppers, just forms and tables.
 *
 * PRODUCTION TODO: gate these behind an admin role once NextAuth lands.
 */

// --- Engineers ---------------------------------------------------------

export async function saveEngineer(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  const name = String(formData.get('name') ?? '').trim()
  const phone = String(formData.get('phone') ?? '').trim()
  if (!name) return

  if (id) {
    await prisma.engineer.update({
      where: { id },
      data: { name, phone: phone || null },
    })
  } else {
    await prisma.engineer.create({ data: { name, phone: phone || null } })
  }
  revalidatePath('/admin/engineers')
  revalidatePath('/')
}

export async function toggleEngineer(formData: FormData) {
  const id = String(formData.get('id'))
  const engineer = await prisma.engineer.findUnique({ where: { id } })
  if (!engineer) return
  // Deactivate rather than delete — old job sheets still reference them.
  await prisma.engineer.update({
    where: { id },
    data: { active: !engineer.active },
  })
  revalidatePath('/admin/engineers')
  revalidatePath('/')
}

// --- Clients -----------------------------------------------------------

export async function saveClient(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  const firmName = String(formData.get('firmName') ?? '').trim()
  if (!firmName) return
  const data = {
    firmName,
    contactPerson: String(formData.get('contactPerson') ?? '').trim() || null,
    phone: String(formData.get('phone') ?? '').trim() || null,
    address: String(formData.get('address') ?? '').trim() || null,
  }

  if (id) await prisma.client.update({ where: { id }, data })
  else await prisma.client.create({ data })
  revalidatePath('/admin/clients')
}

export async function deleteClient(formData: FormData) {
  const id = String(formData.get('id'))
  // Job sheets keep a denormalised copy of the firm name, so removing a client
  // never blanks an existing sheet.
  const used = await prisma.jobSheet.count({ where: { clientId: id } })
  if (used > 0) {
    await prisma.jobSheet.updateMany({
      where: { clientId: id },
      data: { clientId: null },
    })
  }
  await prisma.client.delete({ where: { id } })
  revalidatePath('/admin/clients')
}

// --- Products ----------------------------------------------------------

export async function saveProduct(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  const name = String(formData.get('name') ?? '').trim()
  if (!name) return
  const data = {
    name,
    modelNo: String(formData.get('modelNo') ?? '').trim() || null,
    brand: String(formData.get('brand') ?? '').trim() || null,
    category: String(formData.get('category') ?? '').trim() || null,
  }

  if (id) await prisma.product.update({ where: { id }, data })
  else await prisma.product.create({ data })
  revalidatePath('/admin/products')
  revalidatePath('/jobs/new')
}

export async function toggleProduct(formData: FormData) {
  const id = String(formData.get('id'))
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) return
  await prisma.product.update({
    where: { id },
    data: { active: !product.active },
  })
  revalidatePath('/admin/products')
  revalidatePath('/jobs/new')
}
