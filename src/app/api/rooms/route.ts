import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Busca todas as salas no banco de dados
    const rooms = await prisma.room.findMany()
    return NextResponse.json(rooms)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar salas' }, { status: 500 })
  }
}