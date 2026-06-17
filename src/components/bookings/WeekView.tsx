// src/components/bookings/WeekView.tsx
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import BookingCard from './BookingCard';
import { Agendamento } from '@/types';
import { formatarData } from '@/lib/date-utils';

interface WeekViewProps {
  agendamentos: Agendamento[];
  diasDaSemanaAtual: Date[];
  inicioDaSemana: Date;
  fimDaSemana: Date;
  sessionEmail?: string | null;
  onExcluir: (id: string) => void;
  onSemanaAnterior: () => void;
  onProximaSemana: () => void;
}

export default function WeekView({
  agendamentos,
  diasDaSemanaAtual,
  inicioDaSemana,
  fimDaSemana,
  sessionEmail,
  onExcluir,
  onSemanaAnterior,
  onProximaSemana,
}: WeekViewProps) {
  
  // Variantes para a lista de dias (cascata de dias)
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  // Variantes para o card do dia
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  // Variantes para a lista de agendamentos dentro de um dia (cascata de agendamentos)
  const listVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between rounded-xl bg-surface px-4 py-3 shadow-sm border border-border">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-brand" />
          <h2 className="text-base font-semibold text-foreground hidden sm:block">
            {formatarData(inicioDaSemana.toISOString())} - {formatarData(fimDaSemana.toISOString())}
          </h2>
          <h2 className="text-base font-semibold text-foreground sm:hidden">
            Semana Atual
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onSemanaAnterior}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-subtle hover:text-foreground"
            aria-label="Semana Anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={onProximaSemana}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-subtle hover:text-foreground"
            aria-label="Próxima Semana"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
      >
        {diasDaSemanaAtual.map((dia) => {
          const dataStr = dia.toISOString().split('T')[0];
          const agendamentosDoDia = agendamentos
            .filter((a) => a.startTime.startsWith(dataStr))
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

          const ehHoje = dia.toDateString() === new Date().toDateString();

          return (
            <motion.div 
              key={dataStr} 
              variants={itemVariants}
              className="flex flex-col rounded-xl border border-border bg-surface-subtle overflow-hidden"
            >
              <div className={`border-b px-4 py-3 ${ehHoje ? 'border-brand bg-brand-subtle' : 'border-border bg-surface'}`}>
                <h3 className={`text-sm font-semibold ${ehHoje ? 'text-brand-text' : 'text-foreground'}`}>
                  {dia.toLocaleDateString('pt-BR', { weekday: 'long' })}
                </h3>
                <span className={`text-xs ${ehHoje ? 'text-brand' : 'text-muted'}`}>
                  {dia.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                </span>
              </div>
              
              <div className="flex-1 p-3">
                {agendamentosDoDia.length === 0 ? (
                  <div className="flex h-full items-center justify-center py-6 text-sm italic text-faint">
                    Livre
                  </div>
                ) : (
                  <motion.div 
                    variants={listVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-col gap-3"
                  >
                    {agendamentosDoDia.map((agendamento) => (
                      <BookingCard
                        key={agendamento.id}
                        agendamento={agendamento}
                        sessionEmail={sessionEmail}
                        onExcluir={onExcluir}
                      />
                    ))}
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
