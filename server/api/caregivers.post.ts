import { prisma } from '../utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody<any>(event)
  const keywords = Array.from(new Set(
    (Array.isArray(body?.keywords) ? body.keywords : Array.isArray(body?.messages)
      ? body.messages.map((item: any) => item.keywordDetected).filter(Boolean)
      : []
    )
      .map((keyword: string) => String(keyword).trim().toUpperCase())
      .filter(Boolean)
  ))

  const caregiver = await prisma.caregiver.create({
    data: {
      name: body.name?.trim() || null,
      phone: body.phone?.trim(),
      email: body.email?.trim() || null,
      address: body.address?.trim() || null,
      city: body.city?.trim() || null,
      state: body.state?.trim() || null,
      zip: body.zip?.trim() || null,
      preferredLanguage: body.preferredLanguage?.trim() || null,
      status: body.status || 'ACTIVE',
      firstContactDate: body.firstContactDate ? new Date(body.firstContactDate) : undefined,
      lastInteraction: body.lastInteraction ? new Date(body.lastInteraction) : undefined,
      keywords: keywords.length
        ? {
            create: keywords.map((keyword: string) => ({
              keyword,
            })),
          }
        : undefined,
    },
    include: {
      keywords: {
        orderBy: { keyword: 'asc' },
        select: { keyword: true },
      },
    },
  })

  return {
    caregiver: {
      ...caregiver,
      keywords: caregiver.keywords.map((entry) => entry.keyword),
    },
  }
})
