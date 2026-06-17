import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Ajuste os pontinhos se necessário
import { getServerSession } from 'next-auth';

// 🚀 CRIAR AS 52 REUNIÕES FIXAS (1 ANO)
export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    
    // Trava de segurança máxima no Backend
    if (session?.user?.email !== 'elias.borges@omegaservice.com.br') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { title, dataInicio, horaInicio, horaFim, roomId } = await request.json();

    if (!title || !dataInicio || !horaInicio || !horaFim || !roomId) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 });
    }
    
    const usuarioLogado = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!usuarioLogado) {
      return NextResponse.json({ error: 'Usuário administrador não encontrado no banco.' }, { status: 404 });
    }

    const agendamentosFixos = [];
    
    // Configura as datas iniciais
    const dataLoopStart = new Date(`${dataInicio}T${horaInicio}:00`);
    const dataLoopEnd = new Date(`${dataInicio}T${horaFim}:00`);

    // Loop mágico: Roda 52 vezes (1 ano inteiro de semanas)
    for (let i = 0; i < 52; i++) {
      agendamentosFixos.push({
        title: title,
        startTime: dataLoopStart.toISOString(),
        endTime: dataLoopEnd.toISOString(),
        roomId: roomId,
        organizerEmail: session.user.email,
        userId: usuarioLogado.id,
        isFixed: true, // <- A etiqueta que criamos no schema!
      });

      // Avança exatamente 7 dias para a próxima semana
      dataLoopStart.setDate(dataLoopStart.getDate() + 7);
      dataLoopEnd.setDate(dataLoopEnd.getDate() + 7);
    }

    // Grava as 52 linhas de uma vez só no Neon.tech de forma ultra rápida
    await prisma.booking.createMany({
      data: agendamentosFixos,
    });

    return NextResponse.json({ success: true, count: agendamentosFixos.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 🗑️ APAGAR A SÉRIE DE REUNIÕES FIXAS
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession();
    if (session?.user?.email !== 'elias.borges@omegaservice.com.br') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { title, roomId } = await request.json();

    // Apaga apenas os agendamentos daquela sala específica que combinem com o título e sejam FIXOS
    const deletados = await prisma.booking.deleteMany({
      where: {
        roomId: roomId,
        title: title,
        isFixed: true
      }
    });

    return NextResponse.json({ success: true, count: deletados.count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}