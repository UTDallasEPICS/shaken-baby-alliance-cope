import { readBody, getMethod, createError } from 'h3'
import { createCaregiver, listCaregivers } from '../../utils/cope-fake-db'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  if (method === 'GET') {
    return listCaregivers()
  }

  if (method === 'POST') {
    const body = await readBody(event)
    const name = String(body?.name ?? '').trim()
    const role = String(body?.role ?? '').trim()
    const phone = String(body?.phone ?? '').trim()
    const email = String(body?.email ?? '').trim()
    const patients = String(body?.patients ?? '').trim()
    const status = body?.status === 'Inactive' ? 'Inactive' : 'Active'

    if (!name || !role) {
      throw createError({ statusCode: 400, statusMessage: 'Missing caregiver fields' })
    }

    return createCaregiver({
      name,
      role,
      phone,
      email,
      patients,
      status,
    })
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
})

