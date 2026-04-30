import { prisma } from '../utils/prisma'

export async function listUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      sessions: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username ?? '',
    role: user.role,
    createdAt: user.createdAt,
    lastLogin: user.sessions[0]?.createdAt ?? null,
  }))
}
