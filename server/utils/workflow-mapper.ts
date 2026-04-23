import type { MessageWorkflowOption, MessageWorkflowStep, Workflow } from '#prisma-client'

export type WorkflowLocaleKey = 'en' | 'es'

export type WorkflowOptionPayload = {
  id: string
  label: Record<WorkflowLocaleKey, string>
  replyValue: string
  targetStepId: string | null
}

export type WorkflowStepPayload = {
  id: string
  type: string
  title: string
  keyword: string
  content: Record<WorkflowLocaleKey, string>
  nextStepId: string | null
  options: WorkflowOptionPayload[]
  x: number
  y: number
}

export type WorkflowPayload = {
  id: string
  name: string
  description: string
  status: 'draft' | 'published'
  publishedAt: string | null
  selectedStepId: string
  steps: WorkflowStepPayload[]
}

type WorkflowRecord = Workflow & {
  steps: Array<
    MessageWorkflowStep & {
      options: MessageWorkflowOption[]
    }
  >
}

export function workflowRecordToPayload(workflow: WorkflowRecord): WorkflowPayload {
  return {
    id: workflow.id,
    name: workflow.name,
    description: workflow.description ?? '',
    status: workflow.status === 'published' ? 'published' : 'draft',
    publishedAt: workflow.publishedAt?.toISOString() ?? null,
    selectedStepId: workflow.selectedStepId ?? workflow.steps[0]?.id ?? '',
    steps: workflow.steps
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((step) => ({
        id: step.id,
        type: step.type,
        title: step.title,
        keyword: step.keyword ?? '',
        content: {
          en: step.contentEn ?? '',
          es: step.contentEs ?? '',
        },
        nextStepId: step.nextStepId ?? null,
        x: step.positionX,
        y: step.positionY,
        options: step.options
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((option) => ({
            id: option.id,
            label: {
              en: option.labelEn ?? '',
              es: option.labelEs ?? '',
            },
            replyValue: option.replyValue,
            targetStepId: option.targetStepId ?? null,
          })),
      })),
  }
}

export function normalizeWorkflowPayload(input: any): WorkflowPayload {
  return {
    id: String(input?.id ?? ''),
    name: String(input?.name ?? '').trim(),
    description: String(input?.description ?? '').trim(),
    status: input?.status === 'published' ? 'published' : 'draft',
    publishedAt: input?.publishedAt ? String(input.publishedAt) : null,
    selectedStepId: String(input?.selectedStepId ?? ''),
    steps: Array.isArray(input?.steps)
      ? input.steps.map((step: any, stepIndex: number) => ({
          id: String(step?.id ?? ''),
          type: String(step?.type ?? 'message'),
          title: String(step?.title ?? '').trim(),
          keyword: String(step?.keyword ?? '').trim(),
          content: {
            en: String(step?.content?.en ?? ''),
            es: String(step?.content?.es ?? ''),
          },
          nextStepId: step?.nextStepId ? String(step.nextStepId) : null,
          x: Number(step?.x ?? 0),
          y: Number(step?.y ?? stepIndex * 220),
          options: Array.isArray(step?.options)
            ? step.options.map((option: any) => ({
                id: String(option?.id ?? ''),
                label: {
                  en: String(option?.label?.en ?? ''),
                  es: String(option?.label?.es ?? ''),
                },
                replyValue: String(option?.replyValue ?? ''),
                targetStepId: option?.targetStepId ? String(option.targetStepId) : null,
              }))
            : [],
        }))
      : [],
  }
}
