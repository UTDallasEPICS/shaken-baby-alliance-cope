import { z } from 'zod'
import { processInboundMessage } from '../../utils/message-runtime'

const inboundSchema = z.object({
  phone: z.string().min(1, 'Phone number is required'),
  messageText: z.string().min(1, 'Message text is required'),
  contactName: z.string().optional().nullable(),
})

export default defineEventHandler(async (event) => {
  const body = inboundSchema.parse(await readBody(event))
  const result = await processInboundMessage(body)

  return {
    success: true,
    ...result,
  }
})
