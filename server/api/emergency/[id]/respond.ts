import { readBody, getMethod, createError } from 'h3'
import { respondEmergencyAlert } from '../../../utils/cope-fake-db'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  if (!Number.isFinite(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
  }

  const method = getMethod(event)
  if (method !== 'POST') {
    throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
  }

  const body = await readBody(event)
  const respondedBy = String(body?.respondedBy ?? '').trim() || 'Admin'

  const updated = respondEmergencyAlert(id, respondedBy)
  if (!updated) throw createError({ statusCode: 404, statusMessage: 'Alert not found' })
  return updated
})

