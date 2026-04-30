import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ id?: string }>(event)
  const id = String(body?.id || '').trim()

  if (!id) {
    throw createError({ statusCode: 400, message: 'Knowledge entry id is required' })
  }

  await prisma.$transaction(async (tx) => {
    await tx.aiKnowledgeChunk.deleteMany({ where: { entryId: id } })
    await tx.aiKnowledgeEntry.delete({ where: { id } })
  })

  return { success: true }
})
