import { prisma } from '../utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  await prisma.message.deleteMany({
    where: { caregiverId: body.id },
  })

  await prisma.caregiver.delete({
    where: { id: body.id },
  })

  return { success: true }
})
