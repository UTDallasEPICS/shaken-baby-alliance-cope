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
  const useGemini = body.generate === true || body.useGemini === true
  const useVector = body.vector === true || body.useVector === true

  if (!messageText) {
    throw createError({ statusCode: 400, message: 'Message text is required' })
  }

  const emergency = detectEmergency(messageText)
  let queryEmbedding: number[] | null = null
  let embeddingModel: string | null = null

  let embeddingError: string | null = null

  if ((useVector || useGemini) && !isGreeting(messageText)) {
    try {
      const embedding = await generateGeminiEmbedding({
        text: messageText,
        taskType: 'RETRIEVAL_QUERY',
      })
      queryEmbedding = embedding.values
      embeddingModel = embedding.model
    } catch (error: any) {
      embeddingError = error?.message || error?.statusMessage || 'Gemini embedding failed'
    }
  }

  const retrieval = await retrieveAiKnowledge({
    messageText,
    limit: Number(body.limit) || 5,
    queryEmbedding,
  })

  const fallbackResponse = buildGroundedFallback({
    messageText,
    matches: retrieval.matches,
    isEmergency: emergency.isEmergency,
  })

  const response: Record<string, unknown> = {
    messageText,
    emergency,
    retrievalMode: retrieval.retrievalMode,
    embeddingModel,
    embeddingError,
    queryTokens: retrieval.queryTokens,
    matches: retrieval.matches,
    fallbackResponse,
    generatedResponse: fallbackResponse,
    promptPreview: {
      system: 'Use only the approved knowledge context. If no context answers the question, do not guess.',
      context: retrieval.matches.map((match) => ({
        title: match.title,
        category: match.category,
        text: match.chunkText,
      })),
      user: messageText,
    },
  }

  if (useGemini && !isGreeting(messageText)) {
    if (queryEmbedding !== null || embeddingError !== null) {
      await new Promise(resolve => setTimeout(resolve, 1500))
    }
    try {
      const generated = await generateGroundedGeminiResponse({
        messageText,
        matches: retrieval.matches,
        emergency: emergency.isEmergency,
        model: body.model ? String(body.model) : undefined,
      })

      response.generatedResponse = isUsableGeneratedText(generated.text) ? generated.text : fallbackResponse
      response.provider = generated.provider
      response.model = generated.model
    } catch (error: any) {
      response.generatedResponse = fallbackResponse
      response.provider = 'gemini'
      response.model = body.model ? String(body.model) : undefined
      response.aiError = error?.message || error?.statusMessage || 'Gemini generation failed'
    }
  }

  return response
})
