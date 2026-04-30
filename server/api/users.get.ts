import { prisma } from '../utils/prisma'

export default defineEventHandler(async () => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      sessions: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  return {
    users: users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      username: u.username ?? '',
      role: u.role,
      createdAt: u.createdAt,
      lastLogin: u.sessions[0]?.createdAt ?? null,
    })),
  }
})
