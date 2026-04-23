import { auth } from '../../../utils/auth'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const caregiverId = getRouterParam(event, 'id')
  const body = await readBody<{ body?: string }>(event)
  const content = body?.body?.trim()

  if (!caregiverId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing caregiver id' })
  }

  if (!content) {
    throw createError({ statusCode: 400, statusMessage: 'Note content is required' })
  }

  const caregiver = await prisma.caregiver.findUnique({
    where: { id: caregiverId },
    select: { id: true },
  })

  if (!caregiver) {
    throw createError({ statusCode: 404, statusMessage: 'Caregiver not found' })
  }

  const session = await auth.api.getSession({
    headers: event.node.req.headers as any,
  })

  const note = await prisma.caregiverNote.create({
    data: {
      caregiverId,
      body: content,
      authorName: session?.user?.name || session?.user?.email || 'Admin User',
    },
  })

  return { note }
})
