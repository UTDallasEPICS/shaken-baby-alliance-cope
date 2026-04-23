import { readBody, getMethod, createError } from 'h3'
import { createUser, listUsers } from '../../utils/cope-fake-db'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  if (method === 'GET') {
    return listUsers()
  }

  if (method === 'POST') {
    const body = await readBody(event)
    const name = String(body?.name ?? '').trim()
    const email = String(body?.email ?? '').trim()
    const role = body?.role === 'Editor' || body?.role === 'Viewer' ? body.role : 'Admin'
    const lastLogin = String(body?.lastLogin ?? '').trim()
    const status = body?.status === 'Inactive' ? 'Inactive' : 'Active'

    if (!name || !email) {
      throw createError({ statusCode: 400, statusMessage: 'Missing name or email' })
    }

    return createUser({
      name,
      email,
      role,
      lastLogin: lastLogin || new Date().toISOString().slice(0, 10),
      status,
    })
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
})

