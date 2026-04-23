import { prisma } from '../utils/prisma'
import { buildGroundedFallback, detectEmergency, retrieveAiKnowledge } from '../utils/ai-retrieval'
import { generateGeminiEmbedding, generateGroundedGeminiResponse } from '../utils/ai'

function isGreeting(value: string) {
  return /^(hi|hello|hey|hola|buenos dias|buenas tardes|buenas noches|good morning|good afternoon|good evening)$/i.test(
    value.trim().toLowerCase()
  )
}

function isUsableGeneratedText(value: string) {
  return value.trim().length > 0
}

export default defineEventHandler(async (event) => {
  const body = await readBody<Record<string, unknown>>(event)
  const messageText = String(body.messageText || body.message || '').trim()
  const phone = String(body.phone || 'test').trim()
  const caregiverId = body.caregiverId ? String(body.caregiverId) : null

  if (!messageText) {
    throw createError({ statusCode: 400, message: 'Message text is required' })
  }

  const emergency = detectEmergency(messageText)
  let queryEmbedding: { model: string; values: number[] } | null = null
  let embeddingError: string | null = null

  if (!isGreeting(messageText)) {
    try {
      queryEmbedding = await generateGeminiEmbedding({
        text: messageText,
        taskType: 'RETRIEVAL_QUERY',
      })
    } catch (error: any) {
      embeddingError = error?.message || error?.statusMessage || 'Gemini embedding failed'
    }
  }

  const retrieval = await retrieveAiKnowledge({
    messageText,
    limit: Number(body.limit) || 5,
    queryEmbedding: queryEmbedding?.values || null,
  })

  const fallbackResponse = buildGroundedFallback({
    messageText,
    matches: retrieval.matches,
    isEmergency: emergency.isEmergency,
  })

  let generated: { provider: string; model: string; text: string } | null = null
  let aiError: string | null = null

  if (!isGreeting(messageText)) {
    try {
      generated = await generateGroundedGeminiResponse({
        messageText,
        matches: retrieval.matches,
        emergency: emergency.isEmergency,
        model: body.model ? String(body.model) : undefined,
      })
    } catch (error: any) {
      aiError = error?.message || error?.statusMessage || 'Gemini generation failed'
    }
  }

  const responseText = generated && isUsableGeneratedText(generated.text)
    ? generated.text
    : fallbackResponse
  const outboundMessage = await prisma.message.create({
    data: {
      caregiverId,
      phone,
      contactName: String(body.contactName || 'AI Test').trim() || 'AI Test',
      messageText: responseText,
      normalizedText: responseText.trim().toUpperCase(),
      direction: 'OUTBOUND',
      language: body.language ? String(body.language) : null,
      providerName: generated ? 'Gemini AI' : 'AI Fallback',
      providerMessageId: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sentAt: new Date(),
    },
  })

  await prisma.messageLog.create({
    data: {
      messageId: outboundMessage.id,
      caregiverId,
      phone,
      contactName: String(body.contactName || 'AI Test').trim() || 'AI Test',
      eventType: generated ? 'AI_MESSAGE_GENERATED' : 'AI_MESSAGE_FALLBACK',
      status: generated ? 'GENERATED' : 'FALLBACK',
      direction: 'OUTBOUND',
      providerName: generated ? 'Gemini AI' : 'AI Fallback',
      providerMessageId: outboundMessage.providerMessageId,
      errorMessage: aiError,
      details: JSON.stringify({
        retrievalMode: retrieval.retrievalMode,
        embeddingError,
        matchedChunkIds: retrieval.matches.map((match) => match.chunkId),
      }),
    },
  })

  const log = await prisma.aiResponseLog.create({
    data: {
      messageId: outboundMessage.id,
      caregiverId,
      phone,
      userMessage: messageText,
      aiResponse: responseText,
      matchedEntryIds: JSON.stringify([...new Set(retrieval.matches.map((match) => match.entryId))]),
      matchedChunkIds: JSON.stringify(retrieval.matches.map((match) => match.chunkId)),
      retrievalMode: retrieval.retrievalMode,
      embeddingModel: queryEmbedding?.model || null,
      emergencyFlag: emergency.isEmergency,
      provider: generated?.provider || 'gemini',
      model: generated?.model || (body.model ? String(body.model) : 'gemini'),
      status: generated ? 'SUCCESS' : 'FALLBACK',
      errorMessage: aiError,
    },
  })

  return {
    responseText,
    messageId: outboundMessage.id,
    logId: log.id,
    emergency,
    retrievalMode: retrieval.retrievalMode,
    embeddingModel: queryEmbedding?.model || null,
    embeddingError,
    matches: retrieval.matches,
    provider: generated?.provider || 'gemini',
    model: generated?.model || (body.model ? String(body.model) : 'gemini'),
    aiError,
  }
})
