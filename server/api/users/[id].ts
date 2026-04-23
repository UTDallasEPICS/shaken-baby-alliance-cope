import { readBody, getMethod, createError } from 'h3'
import { deleteUser, updateUser } from '../../utils/cope-fake-db'

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
      email: body?.email,
      role: body?.role,
      lastLogin: body?.lastLogin,
      status: body?.status === 'Inactive' ? 'Inactive' : 'Active',
    }

    const updated = updateUser(id, patch)
    if (!updated) throw createError({ statusCode: 404, statusMessage: 'User not found' })
    return updated
  }

  if (method === 'DELETE') {
    const ok = deleteUser(id)
    if (!ok) throw createError({ statusCode: 404, statusMessage: 'User not found' })
    return { ok: true }
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
})

