import NextAuth from "next-auth/next"
import EmailProvider from "next-auth/providers/email"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "../../../../lib/prisma"

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: {
        host: 'smtp.omegaservice.com.br', 
        port: 587,                  // Tente 465 (SSL) ou 587 (STARTTLS)
        secure: false,               // true para 465, false para 587
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            // Geralmente necessário para servidores internos
            rejectUnauthorized: false 
    }
      },
      from: process.env.EMAIL_USER,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt" as const, // Usa tokens modernos para manter o usuário logado
  },
})

export { handler as GET, handler as POST }