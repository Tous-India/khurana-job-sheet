'use server'

import { revalidatePath } from 'next/cache'
import {
  createClient,
  createEngineer,
  createProduct,
  deleteClientDetachingSheets,
  findEngineer,
  findProduct,
  updateClient,
  updateEngineer,
  updateProduct,
} from '@/lib/db'

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
    await updateEngineer(id, { name, phone: phone || null })
  } else {
    await createEngineer({ name, phone: phone || null })
  }
  revalidatePath('/admin/engineers')
  revalidatePath('/')
}

export async function toggleEngineer(formData: FormData) {
  const id = String(formData.get('id'))
  const engineer = await findEngineer(id)
  if (!engineer) return
  // Deactivate rather than delete — old job sheets still reference them.
  await updateEngineer(id, { active: !engineer.active })
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

  if (id) await updateClient(id, data)
  else await createClient(data)
  revalidatePath('/admin/clients')
}

export async function deleteClient(formData: FormData) {
  const id = String(formData.get('id'))
  // Job sheets keep a denormalised copy of the firm name, so removing a client
  // never blanks an existing sheet — the reference is cleared, the sheet stays.
  await deleteClientDetachingSheets(id)
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

  if (id) await updateProduct(id, data)
  else await createProduct(data)
  revalidatePath('/admin/products')
  revalidatePath('/jobs/new')
}

export async function toggleProduct(formData: FormData) {
  const id = String(formData.get('id'))
  const product = await findProduct(id)
  if (!product) return
  await updateProduct(id, { active: !product.active })
  revalidatePath('/admin/products')
  revalidatePath('/jobs/new')
}
