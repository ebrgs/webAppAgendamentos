// src/components/bookings/BookingCard.tsx
import { motion } from 'framer-motion';
import { Trash2, Users } from 'lucide-react';
import { Agendamento } from '@/types';
import { formatarHorario } from '@/lib/date-utils';
import { cn } from '@/lib/cn';

interface BookingCardProps {
  agendamento: Agendamento;
  sessionEmail?: string | null;
  onExcluir: (id: string) => void;
}

export default function BookingCard({ agendamento, sessionEmail, onExcluir }: BookingCardProps) {
  const isOrganizer = sessionEmail && agendamento.organizerEmail === sessionEmail;
  const isParticipant = false; // Tipo atual não possui participantsEmails

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
      }}
      className="group relative flex flex-col rounded-xl border border-border bg-surface p-4 shadow-card transition-all hover:-translate-y-[2px] hover:shadow-raised"
    >
      {/* Barra lateral de acento */}
      <div className="absolute bottom-0 left-0 top-0 w-1 rounded-l-xl bg-brand" />

      <div className="flex items-start justify-between gap-4 pl-2">
        <div className="flex-1 overflow-hidden">
          <h4 className="truncate text-base font-semibold text-foreground">
            {agendamento.title}
          </h4>
          
          <div className="mt-1 flex items-center gap-2 text-sm text-muted">
            <span className="inline-flex items-center rounded-md bg-surface-subtle px-2 py-0.5 font-medium text-foreground">
              {formatarHorario(agendamento.startTime)} - {formatarHorario(agendamento.endTime)}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-brand-subtle px-2 py-1 text-xs font-medium text-brand-text">
              Sala {agendamento.room?.name || 'Desconhecida'}
            </span>
            {isOrganizer && (
              <span className="inline-flex items-center rounded-md bg-success-subtle px-2 py-1 text-xs font-medium text-success-text tracking-wide uppercase">
                Seu Agendamento
              </span>
            )}
            {isParticipant && !isOrganizer && (
              <span className="inline-flex items-center rounded-md bg-border-subtle px-2 py-1 text-xs font-medium text-muted tracking-wide uppercase">
                Convidado
              </span>
            )}
          </div>

          {/* participantsEmails omitido pois não existe no tipo base */}
        </div>

        {isOrganizer && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onExcluir(agendamento.id)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-faint transition-colors hover:bg-danger-subtle hover:text-danger focus:outline-none focus:ring-2 focus:ring-danger focus:ring-offset-2"
            title="Cancelar Reunião"
          >
            <Trash2 className="h-4 w-4" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
