import { prisma } from '../utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { id, name, phone, email, address, city, state, status, firstContactDate, lastInteraction, messages } = body

  if (messages) {
    await prisma.message.deleteMany({
      where: {
        caregiverId: id,
        messageText: '',
      },
    })

    if (messages.length > 0) {
      await prisma.message.createMany({
        data: messages.map((m: any) => ({
          caregiverId: id,
          keywordDetected: m.keywordDetected,
          phone: phone || '',
          messageText: '',
          direction: 'INBOUND',
        })),
      })
    }
  }

  const updatedCaregiver = await prisma.caregiver.update({
    where: { id },
    data: {
      name,
      phone,
      email,
      address,
      city,
      state,
      status,
      ...(firstContactDate && { firstContactDate: new Date(firstContactDate) }),
      ...(lastInteraction && { lastInteraction: new Date(lastInteraction) }),
    },
    include: {
      messages: {
        select: {
          keywordDetected: true,
        },
      },
    },
  })

  return { caregiver: updatedCaregiver }
})
