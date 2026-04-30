import { prisma } from '../../utils/prisma'
import type { RetrievedKnowledge } from '../../utils/ai-retrieval'

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta'
export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash'
export const DEFAULT_GEMINI_EMBEDDING_MODEL = 'gemini-embedding-001'
const GEMINI_EMBED_TIMEOUT_MS = 8000
const GEMINI_GENERATE_TIMEOUT_MS = 12000

type GeminiPart = { text?: string }

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[]
    }
  }>
  error?: {
    message?: string
  }
}

type GeminiEmbeddingResponse = {
  embedding?: {
    values?: number[]
  }
  error?: {
    message?: string
  }
}

function geminiEndpoint(model: string, method: 'generateContent' | 'embedContent') {
  return `${GEMINI_API_BASE}/models/${encodeURIComponent(model)}:${method}`
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    })
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw createError({ statusCode: 504, message: 'Gemini request timed out' })
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}

async function getSettings() {
  return prisma.systemSettings.findUnique({ where: { id: 'singleton' } })
}

export async function resolveGeminiApiKey(explicitKey?: string | null) {
  if (explicitKey?.trim()) return explicitKey.trim()

  const settings = await getSettings()
  if (settings?.aiProvider === 'gemini' && settings.aiApiKey.trim()) {
    return settings.aiApiKey.trim()
  }

  return process.env.GEMINI_API_KEY?.trim() || ''
}

function assertGeminiApiKey(apiKey: string) {
  if (!apiKey) {
    throw createError({
      statusCode: 400,
      message: 'Gemini API key is not configured. Add it in Settings or GEMINI_API_KEY.',
    })
  }
}

export async function generateGeminiEmbedding(params: {
  text: string
  apiKey?: string | null
  model?: string
  taskType?: 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY' | 'SEMANTIC_SIMILARITY'
}) {
  const apiKey = await resolveGeminiApiKey(params.apiKey)
  assertGeminiApiKey(apiKey)

  const model = params.model || DEFAULT_GEMINI_EMBEDDING_MODEL
  const response = await fetchWithTimeout(geminiEndpoint(model, 'embedContent'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      content: {
        parts: [{ text: params.text }],
      },
      taskType: params.taskType || 'SEMANTIC_SIMILARITY',
    }),
  }, GEMINI_EMBED_TIMEOUT_MS)

  const data = await response.json() as GeminiEmbeddingResponse
  if (!response.ok || data.error) {
    throw createError({
      statusCode: response.status || 502,
      message: data.error?.message || 'Gemini embedding request failed',
    })
  }

  const values = data.embedding?.values
  if (!values?.length) {
    throw createError({ statusCode: 502, message: 'Gemini embedding response was empty' })
  }

  return {
    model,
    values,
  }
}

function buildContext(matches: RetrievedKnowledge[]) {
  return matches
    .map((match, index) => {
      return `Source ${index + 1}: ${match.title} (${match.category})\n${match.chunkText}`
    })
    .join('\n\n')
}

export async function generateGroundedGeminiResponse(params: {
  messageText: string
  matches: RetrievedKnowledge[]
  emergency: boolean
  apiKey?: string | null
  model?: string
}) {
  const apiKey = await resolveGeminiApiKey(params.apiKey)
  assertGeminiApiKey(apiKey)

  const settings = await getSettings()
  const model = params.model || settings?.aiModel || DEFAULT_GEMINI_MODEL
  const context = buildContext(params.matches)

  const systemInstruction = [
    'You are a compassionate SMS support assistant for the Shaken Baby Alliance COPE program.',
    'Use only the approved knowledge sources provided in the context.',
    'If the answer is not supported by the context, say you are not sure and route to MENU, 988, or 911 as appropriate.',
    'Do not invent medical, legal, program, contact, or policy details.',
    'Never diagnose. Keep the reply under 3 short SMS-friendly sentences.',
    'If immediate danger is present, tell the caregiver to call 911. If crisis support is needed, mention call or text 988.',
  ].join(' ')

  const userPrompt = [
    `Emergency detected: ${params.emergency ? 'yes' : 'no'}`,
    `Approved knowledge context:\n${context || 'No approved matching context found.'}`,
    `Caregiver message:\n${params.messageText}`,
    'Write the final caregiver-facing SMS response now.',
  ].join('\n\n')

  const response = await fetchWithTimeout(geminiEndpoint(model, 'generateContent'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        maxOutputTokens: 160,
      },
    }),
  }, GEMINI_GENERATE_TIMEOUT_MS)

  const data = await response.json() as GeminiResponse
  if (!response.ok || data.error) {
    throw createError({
      statusCode: response.status || 502,
      message: data.error?.message || 'Gemini generation request failed',
    })
  }

  const text = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('')
    .trim()

  if (!text) {
    throw createError({ statusCode: 502, message: 'Gemini generation response was empty' })
  }

  return {
    provider: 'gemini',
    model,
    text,
  }
}

export async function embedAllKnowledgeChunks(params: {
  apiKey?: string | null
  model?: string
  onlyMissing?: boolean
} = {}) {
  const apiKey = await resolveGeminiApiKey(params.apiKey)
  assertGeminiApiKey(apiKey)

  const model = params.model || DEFAULT_GEMINI_EMBEDDING_MODEL
  const chunks = await prisma.aiKnowledgeChunk.findMany({
    where: params.onlyMissing
      ? { embeddingJson: null }
      : undefined,
    orderBy: { createdAt: 'asc' },
  })

  let embedded = 0
  for (const chunk of chunks) {
    const result = await generateGeminiEmbedding({
      text: chunk.chunkText,
      apiKey,
      model,
      taskType: 'RETRIEVAL_DOCUMENT',
    })

    await prisma.aiKnowledgeChunk.update({
      where: { id: chunk.id },
      data: {
        embeddingJson: JSON.stringify(result.values),
        embeddingModel: result.model,
        embeddingProvider: 'gemini',
        embeddingDimension: result.values.length,
        embeddedAt: new Date(),
      },
    })
    embedded += 1
  }

  return {
    model,
    embedded,
    totalChunks: chunks.length,
  }
}
