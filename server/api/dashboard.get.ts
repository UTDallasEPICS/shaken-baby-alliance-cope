import { prisma } from '../utils/prisma'

export default defineEventHandler(async () => {
  try {
    const now = new Date()
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0))
    const tomorrowStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0))
    const yesterdayStart = new Date(todayStart)
    yesterdayStart.setUTCDate(todayStart.getUTCDate() - 1)

    const [allMessages, messagesTodayCount, messagesYesterdayCount, caregivers, workflows, triggerSteps] =
      await Promise.all([
        prisma.message.findMany({
          orderBy: { createdAt: 'desc' },
          take: 100,
          include: {
            caregiver: {
              select: { name: true },
            },
            logs: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        }),
        prisma.message.count({ where: { createdAt: { gte: todayStart, lt: tomorrowStart } } }),
        prisma.message.count({ where: { createdAt: { gte: yesterdayStart, lt: todayStart } } }),
        prisma.caregiver.count({ where: { status: { not: 'DELETED' } } }),
        prisma.workflow.count({ where: { isActive: true } }),
        prisma.messageWorkflowStep.findMany({
          where: {
            type: 'trigger',
            keyword: { not: null },
            workflow: { isActive: true },
          },
          select: { keyword: true },
        }),
      ])

    const yesterdayCount = Number(messagesYesterdayCount ?? 0)
    const todayCount = Number(messagesTodayCount ?? 0)
    const percentChange = yesterdayCount === 0
      ? (todayCount === 0 ? 0 : 100)
      : Math.round(((todayCount - yesterdayCount) / yesterdayCount) * 100)

    const activeKeywords = new Set(
      triggerSteps
        .map((step) => step.keyword?.trim().toUpperCase())
        .filter((keyword): keyword is string => Boolean(keyword))
    ).size

    const messages = allMessages.map((message) => {
      const latestLog = message.logs?.[0]
      return {
        id: message.id,
        createdAt: message.createdAt,
        phone: message.phone,
        keywordDetected: message.keywordDetected,
        messageText: message.messageText,
        direction: message.direction,
        status: String(latestLog?.status ?? message.direction ?? 'PENDING').toLowerCase(),
        contactName: message.caregiver?.name || message.contactName || 'Unknown Sender',
      }
    })

    return {
      messages,
      stats: {
        messagesToday: todayCount,
        percentChange,
        activeKeywords,
        activeWorkflow: workflows,
        activeCaregivers: caregivers,
        lastRefreshed: new Date().toISOString(),
      },
    }
  } catch (error) {
    console.error('[dashboard API error]', error)
    throw createError({ statusCode: 500, message: 'Failed to load dashboard data' })
  }
})
