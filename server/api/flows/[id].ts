import { readBody, getMethod, createError } from 'h3'
import { deleteFlow, updateFlow } from '../../utils/cope-fake-db'

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
      keyword: body?.keyword,
      status: body?.status === 'Draft' ? 'Draft' : 'Active',
    }
    const updated = updateFlow(id, patch)
    if (!updated) throw createError({ statusCode: 404, statusMessage: 'Flow not found' })
    return updated
  }

  if (method === 'DELETE') {
    const ok = deleteFlow(id)
    if (!ok) throw createError({ statusCode: 404, statusMessage: 'Flow not found' })
    return { ok: true }
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
})

