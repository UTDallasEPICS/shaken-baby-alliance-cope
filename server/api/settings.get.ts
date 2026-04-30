import { prisma } from '../../utils/prisma'

export default defineEventHandler(async () => {
  let settings = await prisma.systemSettings.findUnique({ where: { id: 'singleton' } })
  if (!settings) {
    settings = await prisma.systemSettings.create({ data: { id: 'singleton' } })
  }
  return settings
})
