import { prisma } from '../../utils/prisma'
import { processInboundMessage } from '../../utils/message-runtime'
import { sendSms } from '../../utils/twilio'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const from: string = body.From || ''
  const messageText: string = body.Body || ''
  const contactName: string = body.ProfileName || ''

  if (!from || !messageText) {
    setResponseStatus(event, 400)
    return 'Missing From or Body'
  }

  const settings = await prisma.systemSettings.findUnique({ where: { id: 'singleton' } })
  if (settings?.systemActive === false || settings?.chatbotEnabled === false) {
    setResponseHeader(event, 'Content-Type', 'text/xml')
    return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'
  }

  const replyFrom: string = body.To || ''
  const result = await processInboundMessage({ phone: from, messageText, contactName: contactName || null })

  for (const reply of result.replies) {
    await sendSms(from, reply, replyFrom)
  }

  setResponseHeader(event, 'Content-Type', 'text/xml')
  return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'
})
