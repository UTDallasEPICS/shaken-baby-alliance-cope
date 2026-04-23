import 'dotenv/config'
import { prisma } from '../server/utils/prisma'
import { scrypt, randomBytes } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt)

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const key = await scryptAsync(password.normalize('NFKC'), salt, 64, {
    N: 16384, r: 16, p: 1, maxmem: 128 * 1024 * 1024,
  }) as Buffer
  return `${salt}:${key.toString('hex')}`
}

async function main() {
  console.log('Start seeding...')

  const alicePassword = await hashPassword('password123')
  const bobPassword = await hashPassword('password123')

  const now = new Date().toISOString()

  // Insert directly via raw SQL to avoid Prisma client version conflicts
  await prisma.$executeRaw`
    INSERT INTO "user" (id, name, email, "emailVerified", role, "createdAt", "updatedAt")
    VALUES ('user_alice', 'Alice Developer', 'alice@a.com', 1, 'admin', ${now}, ${now})
  `
  await prisma.$executeRaw`
    INSERT INTO "account" (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
    VALUES ('acc_alice', 'alice@a.com', 'credential', 'user_alice', ${alicePassword}, ${now}, ${now})
  `

  await prisma.$executeRaw`
    INSERT INTO "user" (id, name, email, "emailVerified", role, "createdAt", "updatedAt")
    VALUES ('user_bob', 'Bob Tester', 'bob@b.com', 1, 'user', ${now}, ${now})
  `
  await prisma.$executeRaw`
    INSERT INTO "account" (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
    VALUES ('acc_bob', 'bob@b.com', 'credential', 'user_bob', ${bobPassword}, ${now}, ${now})
  `

  console.log('Seeding finished. Login: alice@a.com / password123')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
