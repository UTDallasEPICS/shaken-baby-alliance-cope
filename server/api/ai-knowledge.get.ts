import { prisma } from '../utils/prisma'

export default defineEventHandler(async () => {
  const entries = await prisma.aiKnowledgeEntry.findMany({
    orderBy: [
      { active: 'desc' },
      { updatedAt: 'desc' },
    ],
    include: {
      _count: {
        select: { chunks: true },
      },
    },
  })

  return { entries }
})
