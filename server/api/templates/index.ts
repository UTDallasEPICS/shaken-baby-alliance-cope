import { readBody, getMethod, createError } from 'h3'
import { createTemplate, listTemplates } from '../../utils/cope-fake-db'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  if (method === 'GET') {
    return listTemplates()
  }

  if (method === 'POST') {
    const body = await readBody(event)
    const name = String(body?.name ?? '').trim()
    const category = String(body?.category ?? '').trim()
    const preview = String(body?.preview ?? '').trim()
    const usage = String(body?.usage ?? '').trim()
    const lastUpdated = String(body?.lastUpdated ?? '').trim()

    if (!name || !category || !preview) {
      throw createError({ statusCode: 400, statusMessage: 'Missing template fields' })
    }

    return createTemplate({
      name,
      category,
      preview,
      usage: usage || '0 flows',
      lastUpdated: lastUpdated || new Date().toISOString().slice(0, 10),
    })
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
})

