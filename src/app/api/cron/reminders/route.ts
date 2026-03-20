import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

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

export async function GET(request: Request) {
  try {
    const agora = new Date();
    // Pega a data de agora + 35 minutos para termos uma janela de busca segura
    const daquiA35Minutos = new Date(agora.getTime() + 35 * 60000); 

    console.log(`[ROBÔ] Procurando reuniões entre: ${agora.toLocaleString()} e ${daquiA35Minutos.toLocaleString()}`);
    // Busca reuniões que:
    // 1. Começam no futuro (depois de agora)
    // 2. Começam em menos de 35 minutos
    // 3. O lembrete AINDA NÃO foi enviado
    const reunioesProximas = await prisma.booking.findMany({
      where: {
        startTime: {
          gt: agora,
          lte: daquiA35Minutos,
        },
        reminderSent: false, // Só pega os que não foram notificados
      },
      include: { room: true }
    });

    console.log(`[ROBÔ] Encontrou ${reunioesProximas.length} reuniões pendentes.`);

    // Se não tiver nenhuma, encerra a função silenciosamente
    if (reunioesProximas.length === 0) {
      return NextResponse.json({ message: 'Nenhum lembrete pendente.' });
    }

    // Para cada reunião encontrada, envia o e-mail e marca como enviado
    for (const reuniao of reunioesProximas) {
      if (!reuniao.organizerEmail) continue;

      const listaDeEmails = reuniao.participantsEmails 
        ? `${reuniao.organizerEmail}, ${reuniao.participantsEmails}` 
        : reuniao.organizerEmail;
      console.log(`[ROBÔ] Disparando e-mail para a reunião: ${reuniao.title}`);
      const horaFormatada = reuniao.startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      // 1. Dispara o e-mail
      await transporter.sendMail({
        from: `"Salas de Reunião" <${process.env.EMAIL_USER}>`,
        to: listaDeEmails,
        subject: `⏰ Lembrete: Sua reunião "${reuniao.title}" começa em breve!`,
        html: `
          <h2>Sua reunião vai começar em aproximadamente 30 minutos.</h2>
          <p><strong>Motivo:</strong> ${reuniao.title}</p>
          <p><strong>Horário:</strong> ${horaFormatada}</p>
          <p><strong>Sala:</strong> ${reuniao.room.name}</p>
          <br/>
          <p>Por favor, dirija-se à sala no horário marcado.</p>
        `,
      });

      // 2. Marca no banco de dados que o e-mail foi enviado (para não enviar duplicado)
      await prisma.booking.update({
        where: { id: reuniao.id },
        data: { reminderSent: true }
      });
    }

    return NextResponse.json({ message: `${reunioesProximas.length} lembretes enviados!` });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao processar lembretes' }, { status: 500 });
  }
}