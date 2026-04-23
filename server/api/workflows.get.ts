import { prisma } from '../utils/prisma'
import { workflowRecordToPayload } from '../utils/workflow-mapper'

export default defineEventHandler(async () => {
  const workflows = await prisma.workflow.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      steps: {
        orderBy: { sortOrder: 'asc' },
        include: {
          options: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      },
    },
  })

  return {
    flows: workflows.map(workflowRecordToPayload),
  }
})
