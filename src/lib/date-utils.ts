// src/lib/date-utils.ts
import { Agendamento } from '@/types';

/** Formata um ISO string para hora no padrão pt-BR (ex: "14:30") */
export const formatarHorario = (dataString: string): string => {
  const data = new Date(dataString);
  return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

/** Formata um ISO string para data curta no padrão pt-BR (ex: "23/06") */
export const formatarData = (dataString: string): string => {
  const data = new Date(dataString);
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

/**
 * Verifica se existe ao menos um agendamento para o dia, mês e ano informados.
 * Usado pelo calendário para renderizar o ponto indicador de evento.
 */
export const verificarSeTemAgendamento = (
  agendamentos: Agendamento[],
  dia: number,
  mes: number,
  ano: number,
): boolean => {
  return agendamentos.some((ag) => {
    const dataAgendamento = new Date(ag.startTime);
    return (
      dataAgendamento.getDate() === dia &&
      dataAgendamento.getMonth() === mes &&
      dataAgendamento.getFullYear() === ano
    );
  });
};
