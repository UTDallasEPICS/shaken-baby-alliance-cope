import twilio from 'twilio'
import { prisma } from '../../utils/prisma'

async function getTwilioConfig() {
  const settings = await prisma.systemSettings.findUnique({ where: { id: 'singleton' } })
  const sid = settings?.twilioAccountSid?.trim() || process.env.TWILIO_ACCOUNT_SID
  const token = settings?.twilioAuthToken?.trim() || process.env.TWILIO_AUTH_TOKEN
  const from = settings?.twilioPhoneNumber?.trim() || process.env.TWILIO_PHONE_NUMBER

  if (!sid || !token || !from) {
    throw new Error('Twilio credentials not configured. Add them in Settings or as TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_PHONE_NUMBER environment variables.')
  }

  return { client: twilio(sid, token), from }
}

export async function sendSms(to: string, body: string, from?: string) {
  const { client, from: defaultFrom } = await getTwilioConfig()
  const resolvedFrom = from || (to.startsWith('whatsapp:') ? `whatsapp:${defaultFrom}` : defaultFrom)
  return client.messages.create({ from: resolvedFrom, to, body })
}
