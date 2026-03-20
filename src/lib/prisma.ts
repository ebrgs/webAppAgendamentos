import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// 1. Criamos a conexão com o PostgreSQL usando a URL do seu .env
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

// 2. Envolvemos essa conexão no Adaptador do Prisma
const adapter = new PrismaPg(pool)

// 3. Inicializamos o Prisma passando o adaptador (Isso resolve o seu erro!)
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma