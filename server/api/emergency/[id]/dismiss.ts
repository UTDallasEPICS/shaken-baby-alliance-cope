import { readBody, getMethod, createError } from 'h3'
import { dismissEmergencyAlert } from '../../../utils/cope-fake-db'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  if (!Number.isFinite(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
  }

  const method = getMethod(event)
  if (method !== 'POST') {
    throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
  }

  // body is ignored for now; exists for parity with respond endpoint.
  await readBody(event).catch(() => null)

  const updated = dismissEmergencyAlert(id)
  if (!updated) throw createError({ statusCode: 404, statusMessage: 'Alert not found' })
  return updated
})

