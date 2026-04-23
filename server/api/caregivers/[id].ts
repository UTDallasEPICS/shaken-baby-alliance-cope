import { readBody, getMethod, createError } from 'h3'
import { deleteCaregiver, updateCaregiver } from '../../utils/cope-fake-db'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  if (!Number.isFinite(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
  }

  const method = getMethod(event)
  if (method === 'PUT') {
    const body = await readBody(event)
    const patch: any = {
      name: body?.name,
      role: body?.role,
      phone: body?.phone,
      email: body?.email,
      patients: body?.patients,
      status: body?.status === 'Inactive' ? 'Inactive' : 'Active',
    }
    const updated = updateCaregiver(id, patch)
    if (!updated) throw createError({ statusCode: 404, statusMessage: 'Caregiver not found' })
    return updated
  }

  if (method === 'DELETE') {
    const ok = deleteCaregiver(id)
    if (!ok) throw createError({ statusCode: 404, statusMessage: 'Caregiver not found' })
    return { ok: true }
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
})

