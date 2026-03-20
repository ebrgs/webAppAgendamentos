import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

// Interface para o Next.js entender os parâmetros da rota
type RouteParams = {
  params: Promise<{ id: string }>
}

// DELETE: Remover agendamento
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    // CORREÇÃO: Unwrapping params com await
    const { id } = await params;

    await prisma.booking.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Agendamento removido.' });
  } catch (error) {
    console.error("Erro no DELETE:", error);
    return NextResponse.json({ error: 'Falha ao deletar' }, { status: 500 });
  }
}

// PATCH: Editar agendamento
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    // CORREÇÃO: Unwrapping params com await
    const { id } = await params;
    
    const body = await request.json();
    const { title, startTime, endTime, roomId } = body;

    const start = new Date(startTime);
    const end = new Date(endTime);

    // 1. Validação de conflito (Overlapping)
    const conflict = await prisma.booking.findFirst({
      where: {
        roomId: roomId,
        id: { not: id }, // Ignora a si mesmo
        AND: [
          { startTime: { lt: end } },
          { endTime: { gt: start } },
        ],
      },
    });

    if (conflict) {
      return NextResponse.json(
        { error: 'Conflito de horário detectado.' },
        { status: 409 }
      );
    }

    // 2. Update seguro agora que o ID não é mais undefined
    const updated = await prisma.booking.update({
      where: { id },
      data: {
        title,
        startTime: start,
        endTime: end,
        roomId,
      },
    });

    return NextResponse.json(updated);

  } catch (error) {
    console.error("Erro no PATCH:", error);
    return NextResponse.json({ error: 'Erro ao atualizar agendamento' }, { status: 500 });
  }
}