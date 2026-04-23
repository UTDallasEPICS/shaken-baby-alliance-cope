import { reindexAllAiKnowledge } from '../utils/ai-retrieval'
import { embedAllKnowledgeChunks } from '../utils/ai'

export default defineEventHandler(async (event) => {
  const body = await readBody<Record<string, unknown>>(event).catch(() => ({}))
  const result = await reindexAllAiKnowledge()

  if (body.embed === true) {
    const embedding = await embedAllKnowledgeChunks({
      onlyMissing: false,
    })
    return { success: true, ...result, embedding }
  }

  return { success: true, ...result }
})
