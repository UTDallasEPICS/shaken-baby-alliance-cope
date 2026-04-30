import { prisma } from '../../utils/prisma'

export default defineEventHandler(async () => {
  const caregivers = await prisma.caregiver.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      keywords: {
        orderBy: { keyword: 'asc' },
        select: { keyword: true },
      },
    },
  })

  return {
    caregivers: caregivers.map((caregiver) => ({
      ...caregiver,
      keywords: caregiver.keywords.map((entry) => entry.keyword),
    })),
  }
})
