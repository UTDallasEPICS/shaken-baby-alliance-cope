import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ id?: string }>(event)

  if (!body?.id) {
    throw createError({ statusCode: 400, message: 'Caregiver id is required' })
  }

  await prisma.caregiver.update({
    where: { id: body.id },
    data: {
      status: 'DELETED',
      deletedAt: new Date(),
    },
  })

  return { success: true }
})
