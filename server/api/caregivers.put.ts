import { prisma } from '../../utils/prisma'

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

  const updated = await prisma.$transaction(async (tx) => {
    await tx.caregiverKeyword.deleteMany({
      where: { caregiverId: body.id },
    })

    const caregiver = await tx.caregiver.update({
      where: { id: body.id },
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
        deletedAt: body.status === 'DELETED' ? new Date() : null,
        firstContactDate: body.firstContactDate ? new Date(body.firstContactDate) : undefined,
        lastInteraction: body.lastInteraction ? new Date(body.lastInteraction) : undefined,
      },
      include: {
        keywords: {
          orderBy: { keyword: 'asc' },
          select: { keyword: true },
        },
      },
    })

    if (keywords.length) {
      await tx.caregiverKeyword.createMany({
        data: keywords.map((keyword: string) => ({
          caregiverId: body.id,
          keyword,
        })),
      })
    }

    return tx.caregiver.findUniqueOrThrow({
      where: { id: caregiver.id },
      include: {
        keywords: {
          orderBy: { keyword: 'asc' },
          select: { keyword: true },
        },
      },
    })
  })

  return {
    caregiver: {
      ...updated,
      keywords: updated.keywords.map((entry) => entry.keyword),
    },
  }
})
