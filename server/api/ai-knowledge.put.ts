import { prisma } from '../../utils/prisma'
import { reindexAiKnowledgeEntry } from '../../utils/ai-retrieval'

const CATEGORIES = new Set(['Safety', 'Crying', 'Emergency', 'Parenting', 'Organization', 'Other'])

function normalizeCategory(value: unknown) {
  const category = String(value || '').trim()
  return CATEGORIES.has(category) ? category : 'Other'
}

export default defineEventHandler(async (event) => {
  const body = await readBody<Record<string, unknown>>(event)
  const id = String(body.id || '').trim()
  const title = String(body.title || '').trim()
  const content = String(body.content || '').trim()

  if (!id) {
    throw createError({ statusCode: 400, message: 'Knowledge entry id is required' })
  }

  if (!title) {
    throw createError({ statusCode: 400, message: 'Title is required' })
  }

  if (!content) {
    throw createError({ statusCode: 400, message: 'Content is required' })
  }

  const entry = await prisma.aiKnowledgeEntry.update({
    where: { id },
    data: {
      title,
      content,
      category: normalizeCategory(body.category),
      active: body.active === undefined ? true : Boolean(body.active),
    },
  })

  await reindexAiKnowledgeEntry(entry.id)

  return { entry }
})
