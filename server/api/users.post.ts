import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ name: string; email: string; username: string; role: string }>(event)

  if (!body.name?.trim() || !body.email?.trim()) {
    throw createError({ statusCode: 400, message: 'Name and email are required' })
  }

  const id = `user_${Date.now()}`

  const user = await prisma.user.create({
    data: {
      id,
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      username: body.username?.trim() || body.email.split('@')[0],
      displayUsername: body.name.trim(),
      role: body.role ?? 'user',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })

  // Create account for email OTP / better-auth compatibility
  await prisma.account.create({
    data: {
      id: `acct_${id}`,
      accountId: user.email,
      providerId: 'email',
      userId: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })

  return { user }
})
