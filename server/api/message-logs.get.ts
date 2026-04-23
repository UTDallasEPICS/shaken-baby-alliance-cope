import { prisma } from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const keyword = query.keyword as string | undefined
    const status = query.status as string | undefined
    const search = query.search as string | undefined

    const where: any = {}

    if (status && status !== 'All Status') {
      where.status = status.toUpperCase()
    }

    if (search) {
      where.OR = [
        { phone: { contains: search } },
        { contactName: { contains: search } },
        { message: { is: { messageText: { contains: search } } } },
      ]
    }

    if (keyword && keyword !== 'All Keywords') {
      where.message = {
        is: {
          keywordDetected: keyword,
        },
      }
    }

    const [allLogs, filteredLogs] = await Promise.all([
      prisma.messageLog.findMany({
        include: {
          message: {
            select: {
              keywordDetected: true,
            },
          },
        },
      }),
      prisma.messageLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          caregiver: {
            select: { name: true },
          },
          message: {
            select: {
              id: true,
              messageText: true,
              keywordDetected: true,
              direction: true,
            },
          },
        },
      }),
    ])

    const stats = allLogs.reduce((acc, log) => {
      const normalized = String(log.status || 'PENDING').toUpperCase()
      acc.total += 1
      if (normalized === 'DELIVERED') acc.delivered += 1
      else if (normalized === 'FAILED') acc.failed += 1
      else acc.pending += 1
      return acc
    }, { total: 0, delivered: 0, failed: 0, pending: 0 })

    const keywordOptions = [
      'All Keywords',
      ...Array.from(new Set(
        allLogs
          .map((log) => log.message?.keywordDetected?.trim())
          .filter((value): value is string => Boolean(value))
      )).sort(),
    ]

    const logs = filteredLogs.map((log) => ({
      id: log.id,
      timestamp: log.createdAt,
      phone: log.phone,
      contactName: log.caregiver?.name || log.contactName || 'Unknown Sender',
      keyword: log.message?.keywordDetected ?? 'N/A',
      direction: log.direction || log.message?.direction || 'UNKNOWN',
      messageSent: log.message?.messageText ?? '',
      status: String(log.status || 'PENDING').charAt(0) + String(log.status || 'PENDING').slice(1).toLowerCase(),
      providerName: log.providerName ?? 'Internal',
      errorMessage: log.errorMessage,
    }))

    return {
      stats,
      logs,
      keywordOptions,
    }
  } catch (error) {
    console.error('[message-logs API error]', error)
    throw createError({ statusCode: 500, message: 'Failed to load message logs' })
  }
})
