import { prisma } from './prisma'

type RuntimeLocale = 'en' | 'es'

type RuntimeWorkflow = Awaited<ReturnType<typeof loadRuntimeWorkflows>>[number]
type RuntimeStep = RuntimeWorkflow['steps'][number]
type RuntimeOption = RuntimeStep['options'][number]

const UNKNOWN_CAREGIVER_NAME = 'Unknown Caregiver'
const UNKNOWN_SENDER_NAME = 'Unknown Sender'

function normalizeKeyword(value: string) {
  return value.trim().replace(/\s+/g, ' ').toUpperCase()
}

function normalizeLanguage(value?: string | null): RuntimeLocale | null {
  if (!value) return null
  const lowered = value.trim().toLowerCase()
  if (lowered.startsWith('es')) return 'es'
  if (lowered.startsWith('en')) return 'en'
  return null
}

function localizedContent(step: RuntimeStep, locale: RuntimeLocale) {
  return locale === 'es'
    ? (step.contentEs || step.contentEn || '').trim()
    : (step.contentEn || step.contentEs || '').trim()
}

function isLanguageSelectionStep(step: RuntimeStep) {
  return step.title.trim().toLowerCase().includes('language')
}

function inferOptionLanguage(option?: RuntimeOption | null): RuntimeLocale | null {
  if (!option) return null

  const tokens = [
    option.replyValue,
    option.labelEn,
    option.labelEs,
  ].map((value) => normalizeKeyword(value || ''))

  if (tokens.some((value) => value === '2' || value.includes('SPANISH') || value.includes('ESPANOL') || value.includes('INGLES'))) {
    if (tokens.some((value) => value === '2' || value.includes('SPANISH') || value.includes('ESPANOL'))) return 'es'
  }

  if (tokens.some((value) => value === '1' || value.includes('ENGLISH'))) return 'en'
  return null
}

async function loadRuntimeWorkflows() {
  return prisma.workflow.findMany({
    where: { isActive: true },
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
}

function findStep(workflows: RuntimeWorkflow[], workflowId: string | null | undefined, stepId: string | null | undefined) {
  if (!workflowId || !stepId) return null
  const workflow = workflows.find((entry) => entry.id === workflowId)
  if (!workflow) return null
  const step = workflow.steps.find((entry) => entry.id === stepId)
  if (!step) return null
  return { workflow, step }
}

function findTrigger(workflows: RuntimeWorkflow[], keyword: string) {
  for (const workflow of workflows) {
    const trigger = workflow.steps.find((step) => step.type === 'trigger' && normalizeKeyword(step.keyword || '') === keyword)
    if (trigger) return { workflow, step: trigger }
  }
  return null
}

function findPrimaryTrigger(workflows: RuntimeWorkflow[]) {
  return findTrigger(workflows, 'COPE') || workflows
    .map((workflow) => {
      const step = workflow.steps.find((entry) => entry.type === 'trigger')
      return step ? { workflow, step } : null
    })
    .find((entry): entry is { workflow: RuntimeWorkflow, step: RuntimeStep } => Boolean(entry)) || null
}

function findMainMenu(workflows: RuntimeWorkflow[], workflowId?: string | null) {
  const preferredWorkflow = workflowId ? workflows.find((entry) => entry.id === workflowId) : null

  const fromMenuTrigger = (workflow?: RuntimeWorkflow | null) => {
    if (!workflow) return null
    const trigger = workflow.steps.find((step) => step.type === 'trigger' && normalizeKeyword(step.keyword || '') === 'MENU')
    if (!trigger?.nextStepId) return null
    const target = workflow.steps.find((step) => step.id === trigger.nextStepId)
    return target ? { workflow, step: target } : null
  }

  return fromMenuTrigger(preferredWorkflow)
    || fromMenuTrigger(workflows.find((workflow) => workflow.steps.some((step) => step.type === 'trigger' && normalizeKeyword(step.keyword || '') === 'MENU')))
    || (preferredWorkflow
      ? preferredWorkflow.steps.find((step) => step.title.trim().toLowerCase() === 'main menu')
      : null)
      ? {
          workflow: preferredWorkflow!,
          step: preferredWorkflow!.steps.find((step) => step.title.trim().toLowerCase() === 'main menu')!,
        }
      : workflows
          .map((workflow) => {
            const step = workflow.steps.find((entry) => entry.title.trim().toLowerCase() === 'main menu')
            return step ? { workflow, step } : null
          })
          .find((entry): entry is { workflow: RuntimeWorkflow, step: RuntimeStep } => Boolean(entry))
    || null
}

async function ensureCaregiver(phone: string, contactName?: string | null) {
  const normalizedPhone = phone.trim()
  let caregiver = await prisma.caregiver.findUnique({
    where: { phone: normalizedPhone },
  })

  if (!caregiver) {
    caregiver = await prisma.caregiver.create({
      data: {
        phone: normalizedPhone,
        name: contactName?.trim() || UNKNOWN_CAREGIVER_NAME,
        status: 'ACTIVE',
      },
    })
  } else if ((!caregiver.name || caregiver.name === UNKNOWN_CAREGIVER_NAME) && contactName?.trim()) {
    caregiver = await prisma.caregiver.update({
      where: { id: caregiver.id },
      data: { name: contactName.trim() },
    })
  }

  return caregiver
}

async function createMessageLog(data: {
  caregiverId?: string | null
  messageId?: string | null
  phone: string
  contactName?: string | null
  eventType: string
  status: string
  direction?: string | null
  providerName?: string | null
  providerMessageId?: string | null
  errorMessage?: string | null
  details?: string | null
}) {
  return prisma.messageLog.create({
    data: {
      caregiverId: data.caregiverId || null,
      messageId: data.messageId || null,
      phone: data.phone,
      contactName: data.contactName?.trim() || UNKNOWN_SENDER_NAME,
      eventType: data.eventType,
      status: data.status,
      direction: data.direction || null,
      providerName: data.providerName || 'COPE Runtime',
      providerMessageId: data.providerMessageId || null,
      errorMessage: data.errorMessage || null,
      details: data.details || null,
    },
  })
}

async function createStoredMessage(data: {
  caregiverId?: string | null
  phone: string
  contactName?: string | null
  messageText: string
  normalizedText?: string | null
  direction: 'INBOUND' | 'OUTBOUND'
  keywordDetected?: string | null
  language?: string | null
  workflowId?: string | null
  workflowStepId?: string | null
}) {
  const message = await prisma.message.create({
    data: {
      caregiverId: data.caregiverId || null,
      phone: data.phone,
      contactName: data.contactName?.trim() || UNKNOWN_SENDER_NAME,
      messageText: data.messageText,
      normalizedText: data.normalizedText || null,
      direction: data.direction,
      keywordDetected: data.keywordDetected || null,
      language: data.language || null,
      workflowId: data.workflowId || null,
      workflowStepId: data.workflowStepId || null,
      providerName: 'COPE Runtime',
      providerMessageId: `${data.direction.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sentAt: data.direction === 'OUTBOUND' ? new Date() : null,
      receivedAt: data.direction === 'INBOUND' ? new Date() : null,
    },
  })

  await createMessageLog({
    caregiverId: data.caregiverId || null,
    messageId: message.id,
    phone: data.phone,
    contactName: data.contactName || null,
    eventType: data.direction === 'INBOUND' ? 'MESSAGE_RECEIVED' : 'MESSAGE_SENT',
    status: data.direction === 'INBOUND' ? 'RECEIVED' : 'DELIVERED',
    direction: data.direction,
    providerName: 'COPE Runtime',
    providerMessageId: message.providerMessageId,
  })

  return message
}

async function deliverStepSequence(params: {
  caregiverId: string
  phone: string
  contactName: string
  workflow: RuntimeWorkflow
  stepId: string | null
  locale: RuntimeLocale
  prefaceText?: string | null
}) {
  const replies: string[] = []
  const visited = new Set<string>()
  let currentStepId = params.stepId
  let nextStateStepId: string | null = null

  if (params.prefaceText?.trim()) {
    const preface = params.prefaceText.trim()
    replies.push(preface)
    await createStoredMessage({
      caregiverId: params.caregiverId,
      phone: params.phone,
      contactName: params.contactName,
      messageText: preface,
      normalizedText: normalizeKeyword(preface),
      direction: 'OUTBOUND',
      language: params.locale,
      workflowId: params.workflow.id,
    })
  }

  while (currentStepId && !visited.has(currentStepId)) {
    visited.add(currentStepId)
    const step = params.workflow.steps.find((entry) => entry.id === currentStepId)
    if (!step) break

    const body = localizedContent(step, params.locale)
    if (body) {
      replies.push(body)
      await createStoredMessage({
        caregiverId: params.caregiverId,
        phone: params.phone,
        contactName: params.contactName,
        messageText: body,
        normalizedText: normalizeKeyword(body),
        direction: 'OUTBOUND',
        keywordDetected: step.type === 'trigger' ? normalizeKeyword(step.keyword || '') : null,
        language: params.locale,
        workflowId: params.workflow.id,
        workflowStepId: step.id,
      })
    }

    if (step.type === 'menu') {
      nextStateStepId = step.id
      break
    }

    if (step.type === 'end') {
      nextStateStepId = null
      break
    }

    if (!step.nextStepId) {
      nextStateStepId = null
      break
    }

    currentStepId = step.nextStepId
    nextStateStepId = currentStepId
  }

  await prisma.caregiver.update({
    where: { id: params.caregiverId },
    data: {
      preferredLanguage: params.locale === 'es' ? 'SPANISH' : 'ENGLISH',
      currentWorkflowId: nextStateStepId ? params.workflow.id : null,
      currentStepId: nextStateStepId,
      lastInteraction: new Date(),
    },
  })

  return replies
}

export async function processInboundMessage(input: {
  phone: string
  messageText: string
  contactName?: string | null
}) {
  const phone = input.phone.trim()
  const messageText = input.messageText.trim()
  const normalizedText = normalizeKeyword(messageText)
  let caregiver = await ensureCaregiver(phone, input.contactName)
  const contactName = caregiver.name || input.contactName?.trim() || UNKNOWN_SENDER_NAME

  await createStoredMessage({
    caregiverId: caregiver.id,
    phone,
    contactName,
    messageText,
    normalizedText,
    direction: 'INBOUND',
    keywordDetected: normalizedText,
    language: normalizeLanguage(caregiver.preferredLanguage),
    workflowId: caregiver.currentWorkflowId,
    workflowStepId: caregiver.currentStepId,
  })

  const workflows = await loadRuntimeWorkflows()
  if (!workflows.length) {
    const fallback = 'No active workflows are configured yet.'
    await createStoredMessage({
      caregiverId: caregiver.id,
      phone,
      contactName,
      messageText: fallback,
      normalizedText: normalizeKeyword(fallback),
      direction: 'OUTBOUND',
    })
    return {
      caregiverId: caregiver.id,
      contactName,
      language: normalizeLanguage(caregiver.preferredLanguage),
      replies: [fallback],
    }
  }

  // Auto-reset session if inactive for more than 30 minutes
  const SESSION_TIMEOUT_MS = 30 * 60 * 1000
  if (caregiver.currentStepId && caregiver.lastInteraction) {
    const elapsed = Date.now() - new Date(caregiver.lastInteraction).getTime()
    if (elapsed > SESSION_TIMEOUT_MS) {
      await prisma.caregiver.update({
        where: { id: caregiver.id },
        data: { currentWorkflowId: null, currentStepId: null },
      })
      caregiver = { ...caregiver, currentWorkflowId: null, currentStepId: null }
    }
  }

  // If caregiver has no active session, any message starts the language selection
  if (!caregiver.currentStepId) {
    const stopTrigger = findTrigger(workflows, 'STOP')
    if (normalizedText === 'STOP' && stopTrigger) {
      const locale = normalizeLanguage(caregiver.preferredLanguage) || 'en'
      const replies = await deliverStepSequence({
        caregiverId: caregiver.id,
        phone,
        contactName,
        workflow: stopTrigger.workflow,
        stepId: stopTrigger.step.nextStepId,
        locale,
      })
      return { caregiverId: caregiver.id, contactName, language: locale, replies }
    }

    const primaryTrigger = findPrimaryTrigger(workflows)
    if (primaryTrigger) {
      const locale = normalizeLanguage(caregiver.preferredLanguage) || 'en'
      const replies = await deliverStepSequence({
        caregiverId: caregiver.id,
        phone,
        contactName,
        workflow: primaryTrigger.workflow,
        stepId: primaryTrigger.step.nextStepId,
        locale,
      })
      return { caregiverId: caregiver.id, contactName, language: locale, replies }
    }
  }

  // Caregiver has an active session — handle keyword shortcuts first
  const triggerMatch = findTrigger(workflows, normalizedText)
  if (triggerMatch) {
    const locale = normalizeLanguage(caregiver.preferredLanguage) || 'en'
    const replies = await deliverStepSequence({
      caregiverId: caregiver.id,
      phone,
      contactName,
      workflow: triggerMatch.workflow,
      stepId: triggerMatch.step.nextStepId,
      locale,
    })

    return {
      caregiverId: caregiver.id,
      contactName,
      language: locale,
      replies,
    }
  }

  const currentContext = findStep(workflows, caregiver.currentWorkflowId, caregiver.currentStepId)
  if (currentContext?.step.type === 'menu') {
    const matchingOption = currentContext.step.options.find((option) => normalizeKeyword(option.replyValue) === normalizedText)
    const inferredLanguage = isLanguageSelectionStep(currentContext.step)
      ? inferOptionLanguage(matchingOption || currentContext.step.options[0] || null)
      : null
    const locale = inferredLanguage || normalizeLanguage(caregiver.preferredLanguage) || 'en'

    if (matchingOption?.targetStepId) {
      const replies = await deliverStepSequence({
        caregiverId: caregiver.id,
        phone,
        contactName,
        workflow: currentContext.workflow,
        stepId: matchingOption.targetStepId,
        locale,
      })

      return {
        caregiverId: caregiver.id,
        contactName,
        language: locale,
        replies,
      }
    }

    const invalidNotice = locale === 'es'
      ? 'Por favor responda con una de las opciones numeradas del menu.'
      : 'Please reply with one of the numbered menu options.'

    const replies = await deliverStepSequence({
      caregiverId: caregiver.id,
      phone,
      contactName,
      workflow: currentContext.workflow,
      stepId: currentContext.step.id,
      locale,
      prefaceText: invalidNotice,
    })

    return {
      caregiverId: caregiver.id,
      contactName,
      language: locale,
      replies,
    }
  }

  const rememberedLocale = normalizeLanguage(caregiver.preferredLanguage)
  if (rememberedLocale) {
    const mainMenu = findMainMenu(workflows, caregiver.currentWorkflowId)
    if (mainMenu) {
      const replies = await deliverStepSequence({
        caregiverId: caregiver.id,
        phone,
        contactName,
        workflow: mainMenu.workflow,
        stepId: mainMenu.step.id,
        locale: rememberedLocale,
      })

      return {
        caregiverId: caregiver.id,
        contactName,
        language: rememberedLocale,
        replies,
      }
    }
  }

  const primaryTrigger = findPrimaryTrigger(workflows)
  if (primaryTrigger) {
    const locale = rememberedLocale || 'en'
    const replies = await deliverStepSequence({
      caregiverId: caregiver.id,
      phone,
      contactName,
      workflow: primaryTrigger.workflow,
      stepId: primaryTrigger.step.nextStepId,
      locale,
    })

    return {
      caregiverId: caregiver.id,
      contactName,
      language: locale,
      replies,
    }
  }

  return {
    caregiverId: caregiver.id,
    contactName,
    language: rememberedLocale,
    replies: [],
  }
}
