import { prisma } from '../utils/prisma'
import { normalizeWorkflowPayload } from '../utils/workflow-mapper'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ flows?: any[] }>(event)
  const flows = Array.isArray(body?.flows) ? body!.flows.map(normalizeWorkflowPayload) : []

  await prisma.$transaction(async (tx) => {
    await tx.messageWorkflowOption.deleteMany()
    await tx.messageWorkflowStep.deleteMany()
    await tx.workflow.deleteMany()

    for (const flow of flows) {
      if (!flow.id || !flow.name) continue

      await tx.workflow.create({
        data: {
          id: flow.id,
          name: flow.name,
          description: flow.description || null,
          status: flow.status,
          isActive: true,
          publishedAt: flow.publishedAt ? new Date(flow.publishedAt) : null,
          selectedStepId: flow.selectedStepId || null,
        },
      })

      for (const [stepIndex, step] of flow.steps.entries()) {
        if (!step.id || !step.title) continue

        await tx.messageWorkflowStep.create({
          data: {
            id: step.id,
            workflowId: flow.id,
            type: step.type,
            title: step.title,
            keyword: step.keyword || null,
            contentEn: step.content.en,
            contentEs: step.content.es,
            nextStepId: step.nextStepId,
            positionX: step.x,
            positionY: step.y,
            sortOrder: stepIndex,
          },
        })

        if (!step.options.length) continue

        await tx.messageWorkflowOption.createMany({
          data: step.options
            .filter((option) => option.id && option.replyValue)
            .map((option, optionIndex) => ({
              id: option.id,
              stepId: step.id,
              labelEn: option.label.en,
              labelEs: option.label.es,
              replyValue: option.replyValue,
              targetStepId: option.targetStepId,
              sortOrder: optionIndex,
            })),
        })
      }
    }
  })

  return { success: true }
})