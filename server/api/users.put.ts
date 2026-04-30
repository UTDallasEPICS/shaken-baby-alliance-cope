import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ id: string; name: string; email: string; username: string; role: string }>(event)

  if (!body.id || !body.name?.trim() || !body.email?.trim()) {
    throw createError({ statusCode: 400, message: 'ID, name and email are required' })
  }

  const user = await prisma.user.update({
    where: { id: body.id },
    data: {
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      username: body.username?.trim() || undefined,
      displayUsername: body.name.trim(),
      role: body.role ?? 'user',
      updatedAt: new Date(),
    },
  })

  return { user }
})
