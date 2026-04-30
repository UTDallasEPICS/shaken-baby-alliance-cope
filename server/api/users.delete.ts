import { prisma } from '../utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ id: string }>(event)

  if (!body.id) {
    throw createError({ statusCode: 400, message: 'User ID is required' })
  }

  await prisma.session.deleteMany({ where: { userId: body.id } })
  await prisma.account.deleteMany({ where: { userId: body.id } })
  await prisma.user.delete({ where: { id: body.id } })

  return { success: true }
})
