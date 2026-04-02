import { prisma } from '../utils/prisma'

export default defineEventHandler(async (event) =>
{

  // Time-boundary values in UTC to avoid timezone offset issues for DB timestamps
  const now = new Date()
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0))
  const tomorrowStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0))
  const weekStart = new Date(todayStart)
  weekStart.setUTCDate(todayStart.getUTCDate() - 6)
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0))
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setUTCDate(todayStart.getUTCDate() - 1)

  const [messagesMonthList, messagesYesterdayCount, keyword, workflowStep, caregiverCount] =
    await Promise.all([

      // Fetch month messages (current month) and include latest log entry for status
      prisma.message.findMany({
        where: { createdAt: { gte: monthStart, lt: tomorrowStart } },
        orderBy: { createdAt: 'desc' },
        include: { logs: { orderBy: { createdAt: 'desc' }, take: 1 } }
      }),

      // Count messages from yesterday (24h window)
      prisma.message.count({ where: { createdAt: { gte: yesterdayStart, lt: todayStart } } }),

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

  // Derive current today count from month list (UTC local boundaries) to avoid timezone mismatch
  const messagesToday = messagesMonthList.filter(msg => {
    const created = new Date(msg.createdAt)
    return created >= todayStart && created < tomorrowStart
  }).length

  // compute percentage change vs yesterday
  const yesterdayCount = Number(messagesYesterdayCount ?? 0)
  let percentChange = 0
  if (yesterdayCount === 0) {
    percentChange = messagesToday === 0 ? 0 : 100
  } else {
    percentChange = Math.round(((messagesToday - yesterdayCount) / yesterdayCount) * 100)
  }

  const messages = messagesMonthList.map(msg => {
    const msgStatus = msg.logs?.[0]?.status ?? msg.direction ?? 'PENDING'
    return {
      id: msg.id,
      createdAt: msg.createdAt,
      phone: msg.phone,
      keywordDetected: msg.keywordDetected,
      messageText: msg.messageText,
      direction: msg.direction,
      status: String(msgStatus).toLowerCase()
    }
  })

  return {
    messages,
    stats: {
      messagesToday,
      percentChange,
      activeKeywords: keyword,
      activeWorkflow: workflowStep,
      activeCaregivers: caregiverCount,
      lastRefreshed: new Date().toISOString()
    }
  }
})