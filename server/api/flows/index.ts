import { readBody, getMethod, createError } from 'h3'
import { createFlow, listFlows } from '../../utils/cope-fake-db'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  if (method === 'GET') {
    return listFlows()
  }

  if (method === 'POST') {
    const body = await readBody(event)
    const name = String(body?.name ?? '').trim()
    const keyword = String(body?.keyword ?? '').trim()
    const status = body?.status === 'Draft' ? 'Draft' : 'Active'

    if (!name || !keyword) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing name or keyword',
      })
    }

    return createFlow({ name, keyword, status })
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
})

