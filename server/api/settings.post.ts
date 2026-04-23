import { prisma } from '../utils/prisma'

const STRING_FIELDS = [
  'twilioAccountSid',
  'twilioAuthToken',
  'twilioPhoneNumber',
  'twilioMessagingServiceSid',
  'defaultResponseMessage',
  'aiApiKey',
] as const

const BOOLEAN_FIELDS = [
  'systemActive',
  'chatbotEnabled',
  'aiEnabled',
  'autoArchiveMessages',
] as const

const GEMINI_MODELS = new Set(['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash', 'gemini-1.5-pro'])
const OPENAI_MODELS = new Set(['gpt-4o-mini', 'gpt-4o'])
const ARCHIVE_DAYS = new Set([30, 60, 90, 180, 365])

function toBoolean(value: unknown) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return value.toLowerCase() === 'true'
  return Boolean(value)
}

export default defineEventHandler(async (event) => {
  const raw = await readBody<Record<string, unknown>>(event)
  const data: Record<string, string | boolean | number> = {}

  if (raw.smsProvider !== undefined) {
    data.smsProvider = raw.smsProvider === 'twilio' ? 'twilio' : 'twilio'
  }

  for (const field of STRING_FIELDS) {
    if (raw[field] !== undefined) {
      data[field] = String(raw[field] ?? '').trim()
    }
  }

  for (const field of BOOLEAN_FIELDS) {
    if (raw[field] !== undefined) {
      data[field] = toBoolean(raw[field])
    }
  }

  if (raw.aiProvider !== undefined) {
    data.aiProvider = raw.aiProvider === 'openai' ? 'openai' : 'gemini'
  }

  const aiProvider = String(data.aiProvider ?? raw.aiProvider ?? 'gemini')
  if (raw.aiModel !== undefined) {
    const model = String(raw.aiModel)
    const allowed = aiProvider === 'openai' ? OPENAI_MODELS : GEMINI_MODELS
    data.aiModel = allowed.has(model) ? model : aiProvider === 'openai' ? 'gpt-4o-mini' : 'gemini-2.5-flash'
  }

  if (raw.autoArchiveDays !== undefined) {
    const days = Number(raw.autoArchiveDays)
    data.autoArchiveDays = ARCHIVE_DAYS.has(days) ? days : 90
  }

  const settings = await prisma.systemSettings.upsert({
    where: { id: 'singleton' },
    update: data,
    create: { id: 'singleton', ...data },
  })

  return settings
})
