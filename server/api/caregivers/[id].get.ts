import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing caregiver id' })
  }

  const caregiver = await prisma.caregiver.findUnique({
    where: { id },
    include: {
      keywords: {
        orderBy: { keyword: 'asc' },
        select: { keyword: true },
      },
      messages: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          messageText: true,
          direction: true,
          keywordDetected: true,
          createdAt: true,
          language: true,
          providerName: true,
          providerMessageId: true,
          contactName: true,
        },
      },
      notes: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          body: true,
          authorName: true,
          createdAt: true,
        },
      },
    },
  })

  if (!caregiver) {
    throw createError({ statusCode: 404, statusMessage: 'Caregiver not found' })
  }

  const messages = caregiver.messages
  const keywordSet = Array.from(
    new Set(
      messages
        .map((message) => message.keywordDetected?.trim())
        .filter((keyword): keyword is string => Boolean(keyword))
    )
  )
  const lastMessageAt = messages.at(-1)?.createdAt ?? caregiver.lastInteraction ?? caregiver.firstContactDate

  return {
    caregiver: {
      id: caregiver.id,
      name: caregiver.name,
      phone: caregiver.phone,
      email: caregiver.email,
      address: caregiver.address,
      city: caregiver.city,
      state: caregiver.state,
      zip: caregiver.zip,
      preferredLanguage: caregiver.preferredLanguage,
      status: caregiver.status,
      firstContactDate: caregiver.firstContactDate,
      lastInteraction: caregiver.lastInteraction,
      createdAt: caregiver.createdAt,
      updatedAt: caregiver.updatedAt,
    },
    summary: {
      totalMessages: messages.length,
      keywordCount: keywordSet.length,
      keywordsUsed: keywordSet,
      assignedKeywords: caregiver.keywords.map((entry) => entry.keyword),
      workflowsTriggered: messages.filter((message) => Boolean(message.keywordDetected)).length,
      firstContactDate: caregiver.firstContactDate,
      lastInteraction: lastMessageAt,
    },
    messages,
    notes: caregiver.notes,
  }
})
