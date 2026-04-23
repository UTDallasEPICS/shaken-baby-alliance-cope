import { prisma } from '../utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const caregiver = await prisma.caregiver.create({
    data: {
      name: body.name,
      phone: body.phone,
      email: body.email,
      address: body.address ?? '',
      city: body.city ?? '',
      state: body.state ?? '',
      ...(body.firstContactDate && { firstContactDate: new Date(body.firstContactDate) }),
      ...(body.lastInteraction && { lastInteraction: new Date(body.lastInteraction) }),
      status: body.status ?? 'ACTIVE',
      messages: {
        create: (body.messages || []).map((m: any) => ({
          keywordDetected: m.keywordDetected,
          phone: body.phone,
          messageText: '',
          direction: 'INBOUND',
        })),
      },
    },
    include: {
      messages: {
        select: {
          keywordDetected: true,
        },
      },
    },
  })

  return { caregiver }
})
