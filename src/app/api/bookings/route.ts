import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: 'smtp.omegaservice.com.br', // Substitua pelo servidor do seu Zimbra
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
});
// GET: Busca todos os agendamentos (Para montar o calendário no Front)
export async function GET() {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        room: true,
        user: true,
      },
      orderBy: {
        startTime: 'asc', // Já traz ordenado por data e hora
      }
    })
    return NextResponse.json(bookings)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar agendamentos' }, { status: 500 })
  }
}

// POST: Cria um novo agendamento com validação blindada
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, startTime, endTime, roomId, userId, organizerEmail, participantsEmails } = body

    const start = new Date(startTime)
    const end = new Date(endTime)
    const now = new Date()

    // ---------------------------------------------------------
    // 1. VALIDAÇÕES BÁSICAS DE TEMPO
    // ---------------------------------------------------------
    if (start >= end) {
      return NextResponse.json(
        { error: 'O horário de término deve ser posterior ao horário de início.' },
        { status: 400 } // 400 = Bad Request
      )
    }

    if (start < now) {
      return NextResponse.json(
        { error: 'Não é permitido agendar reuniões no passado.' },
        { status: 400 }
      )
    }

    // ---------------------------------------------------------
    // 2. VALIDAÇÃO DE CONFLITO (OVERLAP CHECK)
    // ---------------------------------------------------------
    // A lógica matemática é: Uma reunião entra em conflito se 
    // o seu INÍCIO for antes do TÉRMINO de outra, E o seu TÉRMINO for depois do INÍCIO dessa outra.
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        roomId: roomId,
        startTime: { lt: end },   // Início existente é menor (<) que o Término novo
        endTime: { gt: start },   // Término existente é maior (>) que o Início novo
      },
    })

    const usuarioLogado = await prisma.user.findUnique({
      where: { email: organizerEmail }
    })

    if (!usuarioLogado) {
      return NextResponse.json({ error: 'Usuário não encontrado no banco' }, { status: 400 });
    }

    if (conflictingBooking) {
      return NextResponse.json(
        { error: 'Esta sala já possui um agendamento para este horário.' },
        { status: 409 } // 409 = Conflict
      )
    }

    // ---------------------------------------------------------
    // 3. SE PASSOU EM TUDO, CRIA O AGENDAMENTO
    // ---------------------------------------------------------
    const newBooking = await prisma.booking.create({
      data: {
        title,
        startTime: start,
        endTime: end,
        roomId,
        userId: usuarioLogado.id,
        organizerEmail,
        participantsEmails
      },
      include: {
        room: true, // Retorna os dados da sala junto para confirmar
      }
    })

    if (organizerEmail) {
      // Junta o organizador com os participantes separados por vírgula
      const listaDeEmails = participantsEmails 
        ? `${organizerEmail}, ${participantsEmails}` 
        : organizerEmail;

      const dataFormatada = start.toLocaleDateString('pt-BR');
      const horaFormatada = start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      await transporter.sendMail({
        from: `"Salas de Reunião" <${process.env.EMAIL_USER}>`,
        to: listaDeEmails,
        subject: `📅 Reunião Confirmada: ${title}`,
        html: `
          <h2>Reunião Agendada com Sucesso!</h2>
          <p><strong>Motivo:</strong> ${title}</p>
          <p><strong>Data:</strong> ${dataFormatada} às ${horaFormatada}</p>
          <p><strong>Sala:</strong> ${newBooking.room.name}</p>
          <br/>
          <p>Você receberá um lembrete 30 minutos antes de começar.</p>
        `,
      });
    }

    return NextResponse.json(newBooking, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Erro interno ao criar agendamento' },
      { status: 500 }
    )
  }
}
