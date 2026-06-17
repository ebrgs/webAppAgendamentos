// src/types/index.ts

/** Representa um agendamento retornado pela API */
export interface Agendamento {
  id: string;
  title: string;
  startTime: string; // ISO string (Prisma serializa DateTime assim)
  endTime: string;
  organizerEmail: string;
  room?: {
    name: string;
  };
}

/** Representa uma sala de reunião retornada pela API */
export interface Sala {
  id: string;
  name: string;
}
