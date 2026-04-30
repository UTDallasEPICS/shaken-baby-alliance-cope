import { prisma } from '../../utils/prisma'
import { randomBytes, scrypt } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt) as (p: string, s: string, n: number, o: object) => Promise<Buffer>

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const key = await scryptAsync(password.normalize('NFKC'), salt, 64, { N: 16384, r: 16, p: 1, maxmem: 128 * 1024 * 1024 })
  return `${salt}:${key.toString('hex')}`
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{ name: string; email: string; username: string; password: string; role: string }>(event)

  if (!body.name?.trim() || !body.email?.trim() || !body.password?.trim()) {
    throw createError({ statusCode: 400, message: 'Name, email and password are required' })
  }

  const id = `user_${Date.now()}`
  const passwordHash = await hashPassword(body.password)

  const user = await prisma.user.create({
    data: {
      id,
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      username: body.username?.trim() || body.email.split('@')[0],
      displayUsername: body.name.trim(),
      role: body.role ?? 'user',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })

  await prisma.account.create({
    data: {
      id: `acct_${id}`,
      accountId: user.email,
      providerId: 'credential',
      userId: user.id,
      password: passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })

  return { user }
})
