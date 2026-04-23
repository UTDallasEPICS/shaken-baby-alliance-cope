import { prisma } from '../utils/prisma'

export default defineEventHandler(async () => {
  const caregivers = await prisma.caregiver.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      messages: {
        select: {
          keywordDetected: true,
        },
      },
    },
  })

  return {
    caregivers: caregivers.map((c) => ({
      ...c,
      messages: c.messages || [],
    })),
  }
})
