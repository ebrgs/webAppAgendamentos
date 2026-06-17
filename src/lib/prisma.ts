import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
// NOTA: O cast `as any` é necessário por um conflito entre a versão de @types/pg
// do projeto raiz e a versão embutida em @prisma/adapter-pg. Ambas são funcionalmente
// idênticas em runtime — este é um problema de tipagem estrutural do TypeScript.
const adapter = new PrismaPg(pool as unknown as ConstructorParameters<typeof PrismaPg>[0])

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma