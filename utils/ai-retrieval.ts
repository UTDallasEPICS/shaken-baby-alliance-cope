import { createHash } from 'node:crypto'
import { prisma } from '../server/utils/prisma'

const MAX_CHUNK_CHARS = 900
const MIN_TOKEN_LENGTH = 3

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'that', 'this', 'with', 'you', 'your', 'are', 'can', 'not', 'but', 'have', 'has', 'was', 'were',
  'baby', 'please', 'need', 'help', 'what', 'when', 'how', 'why', 'who', 'all', 'any', 'our', 'out', 'now', 'like',
  'los', 'las', 'que', 'para', 'con', 'una', 'uno', 'por', 'del', 'estoy', 'esta', 'este', 'beb', 'ayuda',
])

const EMERGENCY_PATTERNS = [
  /\b911\b/i,
  /\b988\b/i,
  /\bemergency\b/i,
  /\bdanger\b/i,
  /\bunsafe\b/i,
  /\bshake\b/i,
  /\bshaking\b/i,
  /\bhurt\b/i,
  /\bharm\b/i,
  /\bkill\b/i,
  /\bdie\b/i,
  /\bangry\b/i,
  /\bfrustrated\b/i,
  /\bscared\b/i,
  /\bunresponsive\b/i,
  /\bnot breathing\b/i,
  /\bbreathing normally\b/i,
  /\bturning blue\b/i,
  /\bseizure\b/i,
  /\bchoking\b/i,
  /\bcan't take\b/i,
  /\bcant take\b/i,
  /\blose control\b/i,
  /\blosing control\b/i,
  /\b911\b/i,
  /\bemergencia\b/i,
  /\bpeligro\b/i,
  /\bsacudir\b/i,
  /\blastimar\b/i,
  /\bherir\b/i,
  /\bmatar\b/i,
  /\benojad/i,
  /\bfrustrad/i,
]

type ChunkRecord = Awaited<ReturnType<typeof prisma.aiKnowledgeChunk.findMany>>[number] & {
  entry?: {
    id: string
    title: string
    category: string
    active: boolean
  }
}

export type RetrievedKnowledge = {
  chunkId: string
  entryId: string
  title: string
  category: string
  chunkText: string
  score: number
  lexicalScore: number
  vectorScore: number | null
}

const MIN_RETRIEVAL_SCORE = 6.5

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenize(value: string) {
  return normalizeText(value)
    .split(' ')
    .filter((token) => token.length >= MIN_TOKEN_LENGTH && !STOP_WORDS.has(token))
}

function isGreeting(value: string) {
  const normalized = normalizeText(value)
  return /^(hi|hello|hey|hola|buenos dias|buenas tardes|buenas noches|good morning|good afternoon|good evening)$/.test(normalized)
}

function chunkContent(entry: { title: string; category: string; content: string }) {
  const paragraphs = entry.content
    .split(/\n{2,}|\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)

  const chunks: string[] = []
  let current = ''

  for (const paragraph of paragraphs.length ? paragraphs : [entry.content.trim()]) {
    const candidate = current ? `${current}\n${paragraph}` : paragraph
    if (candidate.length <= MAX_CHUNK_CHARS) {
      current = candidate
      continue
    }

    if (current) chunks.push(current)
    current = paragraph
  }

  if (current) chunks.push(current)

  return chunks.map((chunk) => `[${entry.category}] ${entry.title}\n${chunk}`)
}

function hashText(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

function parseEmbedding(value?: string | null) {
  if (!value) return null
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) && parsed.every((item) => typeof item === 'number') ? parsed as number[] : null
  } catch {
    return null
  }
}

function cosineSimilarity(left: number[], right: number[]) {
  if (!left.length || left.length !== right.length) return null
  let dot = 0
  let leftNorm = 0
  let rightNorm = 0

  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index]
    leftNorm += left[index] * left[index]
    rightNorm += right[index] * right[index]
  }

  if (!leftNorm || !rightNorm) return null
  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm))
}

function lexicalScore(queryTokens: string[], chunk: ChunkRecord) {
  if (!queryTokens.length) return 0

  const haystack = normalizeText(`${chunk.entry?.title || ''} ${chunk.entry?.category || ''} ${chunk.chunkText}`)
  const chunkTokens = new Set(tokenize(haystack))
  let score = 0

  for (const token of queryTokens) {
    if (chunkTokens.has(token)) score += 3
    else if (haystack.includes(token)) score += 1
  }

  if (chunk.entry?.category === 'Emergency' && queryTokens.some((token) => ['angry', 'hurt', 'harm', 'shake', 'danger', 'emergency', 'frustrated'].includes(token))) {
    score += 4
  }

  return score / Math.max(queryTokens.length, 1)
}

export function detectEmergency(messageText: string) {
  const matchedPatterns = EMERGENCY_PATTERNS
    .filter((pattern) => pattern.test(messageText))
    .map((pattern) => pattern.source.replace(/\\b/g, '').replace(/\\/g, ''))

  return {
    isEmergency: matchedPatterns.length > 0,
    matchedPatterns,
  }
}

export async function reindexAiKnowledgeEntry(entryId: string) {
  const entry = await prisma.aiKnowledgeEntry.findUnique({ where: { id: entryId } })
  if (!entry) return { entryId, chunks: 0 }

  const chunks = chunkContent(entry)
  await prisma.$transaction(async (tx) => {
    await tx.aiKnowledgeChunk.deleteMany({ where: { entryId } })

    if (chunks.length) {
      await tx.aiKnowledgeChunk.createMany({
        data: chunks.map((chunkText) => ({
          entryId,
          chunkText,
          chunkHash: hashText(chunkText),
          tokenCount: tokenize(chunkText).length,
        })),
      })
    }
  })

  return { entryId, chunks: chunks.length }
}

export async function reindexAllAiKnowledge() {
  const entries = await prisma.aiKnowledgeEntry.findMany({ select: { id: true } })
  const results = []

  for (const entry of entries) {
    results.push(await reindexAiKnowledgeEntry(entry.id))
  }

  return {
    entries: results.length,
    chunks: results.reduce((sum, result) => sum + result.chunks, 0),
    results,
  }
}

export async function retrieveAiKnowledge(params: {
  messageText: string
  limit?: number
  queryEmbedding?: number[] | null
}) {
  const limit = params.limit || 5
  const queryTokens = tokenize(params.messageText)
  const chunks = await prisma.aiKnowledgeChunk.findMany({
    where: {
      entry: { active: true },
    },
    include: {
      entry: {
        select: {
          id: true,
          title: true,
          category: true,
          active: true,
        },
      },
    },
  })

  const scored = chunks
    .map((chunk) => {
      const lexical = lexicalScore(queryTokens, chunk)
      const chunkEmbedding = parseEmbedding(chunk.embeddingJson)
      const vector = params.queryEmbedding && chunkEmbedding
        ? cosineSimilarity(params.queryEmbedding, chunkEmbedding)
        : null
      const vectorScore = vector === null ? 0 : Math.max(0, vector) * 10

      return {
        chunkId: chunk.id,
        entryId: chunk.entry.id,
        title: chunk.entry.title,
        category: chunk.entry.category,
        chunkText: chunk.chunkText,
        score: lexical + vectorScore,
        lexicalScore: lexical,
        vectorScore: vector,
      }
    })
    .filter((item) => item.score >= MIN_RETRIEVAL_SCORE)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)

  return {
    queryTokens,
    retrievalMode: params.queryEmbedding ? 'hybrid' : 'lexical',
    matches: scored as RetrievedKnowledge[],
  }
}

export function buildGroundedFallback(params: {
  messageText: string
  matches: RetrievedKnowledge[]
  isEmergency: boolean
}) {
  const normalized = normalizeText(params.messageText)
  const topCategory = params.matches[0]?.category
  const topTitle = params.matches[0]?.title.toLowerCase() || ''
  const isSpanish = /\b(como|bebe|llorar|ayuda|enojad|abrumad|seguro|cuna|sacudir)\b/.test(normalized)
  const mentionsCrying = /\b(cry|crying|cries|llorar|llora)\b/.test(normalized) || topCategory === 'Crying'
  const mentionsSleep = /\b(sleep|sleeping|crib|bassinet|blanket|pillow|dormir|cuna)\b/.test(normalized) || topTitle.includes('sleep')
  const mentionsFeeding = /\b(feed|feeding|milk|formula|breast|bottle|eat|feeding|aliment)\b/.test(normalized) || topTitle.includes('feeding')
  const mentionsProgram = /\b(cope|program|staff|call me|follow up|resource|resources)\b/.test(normalized) || topCategory === 'Organization'
  const mentionsMedicine = /\b(medicine|medication|dose|dosage|tylenol|ibuprofen|fever reducer|gripe water|remedy|remedies|medicina|dosis)\b/.test(normalized) || topTitle.includes('medicine')
  const mentionsMedicalConcern = /\b(fever|sick|ill|vomit|vomiting|dehydrated|dehydration|breathing|injury|injured|doctor|urgent care|hospital|fiebre|vomito|respira|lesion)\b/.test(normalized) || topTitle.includes('medical')
  const mentionsImmediateMedicalEmergency = /\b(not breathing|unresponsive|turning blue|blue|seizure|choking|cannot breathe|cant breathe|injured|dropped|shaken|hit|no respira|azul|convulsion|ahog)\b/.test(normalized)

  if (isGreeting(params.messageText)) {
    return isSpanish
      ? 'Hola, somos COPE y estamos aqui para apoyar. Responda MENU para ver opciones, o llame/envie mensaje al 988 si necesita apoyo ahora.'
      : "Hello, we're COPE and we're here to support you. Reply MENU to see options, or call/text 988 if you need support now."
  }

  if (params.isEmergency) {
    if (mentionsImmediateMedicalEmergency) {
      return isSpanish
        ? 'Llame al 911 inmediatamente. No espere una respuesta por mensaje si el bebe no respira normal, esta inconsciente, se esta poniendo azul, se esta ahogando, tiene convulsiones o esta gravemente lesionado.'
        : 'Call 911 immediately. Do not wait for a text reply if your baby is not breathing normally, unresponsive, turning blue, choking, having a seizure, or seriously injured.'
    }

    return isSpanish
      ? 'Ponga al bebe en un lugar seguro como una cuna y alejese ahora. Si hay peligro inmediato, llame al 911. Si necesita apoyo en este momento, llame o envie un mensaje al 988.'
      : 'Put your baby in a safe place like a crib and step away now. If anyone is in immediate danger, call 911. If you need support right now, call or text 988.'
  }

  if (!params.matches.length) {
    return isSpanish
      ? 'No estoy seguro de tener la informacion correcta. Responda MENU para ver opciones, o llame/envie mensaje al 988 si necesita apoyo ahora.'
      : "I'm not sure I have the right information. Reply MENU for options, or call/text 988 if you need support now."
  }

  if (isSpanish && mentionsCrying) {
    return 'Revise si el bebe tiene hambre, panal sucio, gases, calor, frio o sueno. Intente calmarlo suavemente con sonidos tranquilos o meciendolo con cuidado. Si se siente frustrado/a, ponga al bebe seguro en la cuna y tome un descanso corto.'
  }

  if (isSpanish && (normalized.includes('abrum') || normalized.includes('enoj') || normalized.includes('sacudir'))) {
    return 'Ponga al bebe en un lugar seguro como una cuna y alejese unos minutos. Respire lento 10 veces. Si necesita apoyo ahora, llame o envie un mensaje al 988; si hay peligro inmediato, llame al 911.'
  }

  if (mentionsSleep) {
    return 'For safe sleep, place your baby alone, on their back, on a firm flat surface like a crib or bassinet. Keep pillows, blankets, toys, bumpers, and loose items out of the sleep space.'
  }

  if (mentionsCrying) {
    return "I'm sorry, crying can feel really hard. Check feeding, diaper, temperature, gas, and sleep, then try one soothing step like gentle rocking, soft shushing, dim lights, or burping. If you feel overwhelmed, place your baby safely in a crib and take a short break."
  }

  if (mentionsFeeding) {
    return "For feeding, keep it basic and follow your clinician's guidance: feed on demand or as advised, burp gently, and watch wet diapers and behavior. If your baby is not feeding, seems dehydrated, very sleepy, or you are worried, contact a medical professional."
  }

  if (mentionsMedicine) {
    return "I cannot recommend medicines, doses, supplements, or home remedies by message. Please contact your baby's doctor, a pharmacist, nurse line, or urgent care for medication questions. If this is an emergency, call 911."
  }

  if (mentionsMedicalConcern) {
    return 'I cannot diagnose medical concerns by message. If you are worried about breathing, fever, dehydration, injury, repeated vomiting, unusual sleepiness, or your baby not acting normally, contact a medical professional. Call 911 for emergency symptoms.'
  }

  if (mentionsProgram) {
    return 'COPE can provide support, safety reminders, and caregiver resources by message. Reply MENU to see available options. If you need urgent emotional support, call or text 988.'
  }

  const top = params.matches[0]
  const body = top.chunkText
    .replace(/^\[[^\]]+\]\s*/, '')
    .replace(top.title, '')
    .trim()

  return body.length > 280 ? `${body.slice(0, 277).trim()}...` : body
}
