import { prisma } from '../utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const selectedPhone = typeof query.phone === 'string' ? query.phone.trim() : ''

  const messages = await prisma.message.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      caregiver: {
        select: {
          id: true,
          name: true,
          preferredLanguage: true,
          status: true,
        },
      },
    },
  })

  const conversationMap = new Map<string, {
    phone: string
    caregiverId: string | null
    contactName: string
    preferredLanguage: string | null
    caregiverStatus: string | null
    lastMessageAt: Date
    lastMessageText: string
    lastDirection: string
    totalMessages: number
  }>()

  for (const message of messages) {
    const key = message.phone
    const existing = conversationMap.get(key)
    if (!existing) {
      conversationMap.set(key, {
        phone: message.phone,
        caregiverId: message.caregiverId ?? null,
        contactName: message.caregiver?.name || message.contactName || 'Unknown Sender',
        preferredLanguage: message.caregiver?.preferredLanguage || message.language || null,
        caregiverStatus: message.caregiver?.status || null,
        lastMessageAt: message.createdAt,
        lastMessageText: message.messageText,
        lastDirection: message.direction,
        totalMessages: 1,
      })
      continue
    }

    existing.totalMessages += 1
  }

  const conversations = Array.from(conversationMap.values()).sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime())
  const activePhone = selectedPhone || conversations[0]?.phone || ''

  const conversationMessages = activePhone
    ? await prisma.message.findMany({
        where: { phone: activePhone },
        orderBy: { createdAt: 'asc' },
        include: {
          caregiver: {
            select: {
              id: true,
              name: true,
              preferredLanguage: true,
              status: true,
            },
          },
          logs: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              status: true,
              eventType: true,
              errorMessage: true,
              providerName: true,
              createdAt: true,
            },
          },
        },
      })
    : []

  return {
    conversations: conversations.map((conversation) => ({
      ...conversation,
      lastMessageAt: conversation.lastMessageAt.toISOString(),
    })),
    activePhone,
    messages: conversationMessages.map((message) => ({
      id: message.id,
      caregiverId: message.caregiverId,
      phone: message.phone,
      contactName: message.caregiver?.name || message.contactName || 'Unknown Sender',
      messageText: message.messageText,
      normalizedText: message.normalizedText,
      direction: message.direction,
      keywordDetected: message.keywordDetected,
      language: message.language,
      workflowId: message.workflowId,
      workflowStepId: message.workflowStepId,
      providerName: message.providerName,
      providerMessageId: message.providerMessageId,
      createdAt: message.createdAt.toISOString(),
      logStatus: message.logs[0]?.status || null,
      logEventType: message.logs[0]?.eventType || null,
      logErrorMessage: message.logs[0]?.errorMessage || null,
    })),
  }
})