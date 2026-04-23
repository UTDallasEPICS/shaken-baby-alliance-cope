import { readBody, getMethod, createError } from 'h3'
import { deleteTemplate, updateTemplate } from '../../utils/cope-fake-db'

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
      category: body?.category,
      preview: body?.preview,
      usage: body?.usage,
      lastUpdated: body?.lastUpdated,
    }
    const updated = updateTemplate(id, patch)
    if (!updated) throw createError({ statusCode: 404, statusMessage: 'Template not found' })
    return updated
  }

  if (method === 'DELETE') {
    const ok = deleteTemplate(id)
    if (!ok) throw createError({ statusCode: 404, statusMessage: 'Template not found' })
    return { ok: true }
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
})

