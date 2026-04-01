import { prisma } from '../utils/prisma'

export default defineEventHandler(async (event) => {

  // Get today date in America/Chicago timezone
  const todayDate = new Date(new Date().toLocaleDateString('en-US', { timeZone: 'America/Chicago' }))
  // Convert to number since SQLite stores createdAt as numeric value
  const todayTimestamp = todayDate.getTime()

  const [messages, messagesTodayRaw, keyword, workflowStep, caregiverCount] =
    await Promise.all([

      // Fetch all messages newest first
      prisma.message.findMany({
        orderBy: { createdAt: 'asc' }
      }),

      //using raw SQL to count all rows with today date and call it count (bigint)
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM message 
        WHERE createdAt >= ${todayTimestamp}
      `,

      // Count active keywords
      prisma.keyword.count({
        where: { isActive: true }
      }),

      // Count workflow steps
      prisma.workflowStep.count(),

      // Count active caregivers
      prisma.caregiver.count({
        where: { status: "ACTIVE" }
      })
    ])

  // Raw SQL returns bigint so convert it to a regular number
  const messagesToday = Number(messagesTodayRaw[0]?.count ?? 0)

  return {
    messages,
    stats: {
      messagesToday,          
      activeKeywords: keyword,
      activeWorkflow: workflowStep,
      activeCaregivers: caregiverCount,
    }
  }
})