// src/components/calendar/CalendarView.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Agendamento } from '@/types';
import { verificarSeTemAgendamento } from '@/lib/date-utils';
import BookingCard from '../bookings/BookingCard';
import { cn } from '@/lib/cn';

interface CalendarViewProps {
  agendamentos: Agendamento[];
  dataAtual: Date;
  diaSelecionado: number;
  sessionEmail?: string | null;
  onDiaClick: (dia: number) => void;
  onMesAnterior: () => void;
  onProximoMes: () => void;
  onExcluir: (id: string) => void;
}

export default function CalendarView({
  agendamentos,
  dataAtual,
  diaSelecionado,
  sessionEmail,
  onDiaClick,
  onMesAnterior,
  onProximoMes,
  onExcluir,
}: CalendarViewProps) {
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');

  const ano = dataAtual.getFullYear();
  const mes = dataAtual.getMonth();

  const primeiroDiaDoMes = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const diasAnteriores = Array.from({ length: primeiroDiaDoMes }, (_, i) => i);
  const dias = Array.from({ length: diasNoMes }, (_, i) => i + 1);
  const diasDaSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const handlePrevMonth = () => {
    setSlideDirection('left');
    onMesAnterior();
  };

  const handleNextMonth = () => {
    setSlideDirection('right');
    onProximoMes();
  };

  const hoje = new Date();
  const isMesAtual = ano === hoje.getFullYear() && mes === hoje.getMonth();
  const diaDeHoje = hoje.getDate();

  const agendamentosDoDiaSelecionado = agendamentos.filter((a) => {
    const dataAg = new Date(a.startTime);
    return (
      dataAg.getFullYear() === ano &&
      dataAg.getMonth() === mes &&
      dataAg.getDate() === diaSelecionado
    );
  }).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const listVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  const monthVariants = {
    enter: (dir: 'left' | 'right') => ({ x: dir === 'right' ? 30 : -30, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: 'left' | 'right') => ({ x: dir === 'right' ? -30 : 30, opacity: 0 })
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
      {/* Calendário (Esquerda) */}
      <div className="w-full lg:w-[360px] lg:shrink-0 lg:sticky lg:top-24">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold capitalize text-foreground flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-brand" />
              {dataAtual.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-subtle hover:text-foreground"
                aria-label="Mês Anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={handleNextMonth}
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-subtle hover:text-foreground"
                aria-label="Próximo Mês"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {diasDaSemana.map((d) => (
              <div key={d} className="text-xs font-semibold text-muted uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          <div className="relative overflow-hidden min-h-[260px]">
            <AnimatePresence initial={false} custom={slideDirection} mode="popLayout">
              <motion.div
                key={`${ano}-${mes}`}
                custom={slideDirection}
                variants={monthVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="grid grid-cols-7 gap-1"
              >
                {diasAnteriores.map((d) => (
                  <div key={`vazio-${d}`} className="h-10 w-10" />
                ))}

                {dias.map((dia) => {
                  const temAgendamento = verificarSeTemAgendamento(agendamentos, dia, mes, ano);
                  const isSelecionado = diaSelecionado === dia;
                  const isHoje = isMesAtual && dia === diaDeHoje;

                  return (
                    <button
                      key={dia}
                      onClick={() => onDiaClick(dia)}
                      className={cn(
                        'relative flex h-10 w-full items-center justify-center rounded-full text-sm font-medium transition-all',
                        isSelecionado
                          ? 'bg-brand text-white shadow-md scale-105'
                          : isHoje
                          ? 'bg-brand-subtle text-brand-text hover:bg-brand hover:text-white'
                          : 'text-foreground hover:bg-surface-subtle'
                      )}
                    >
                      {dia}
                      {temAgendamento && (
                        <span
                          className={cn(
                            'absolute bottom-1.5 h-1 w-1 rounded-full',
                            isSelecionado ? 'bg-white/80' : 'bg-brand'
                          )}
                        />
                      )}
                    </button>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Lista de Reuniões do Dia Selecionado (Direita) */}
      <div className="flex-1">
        <div className="mb-6 rounded-xl border border-border bg-surface px-5 py-4 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground">
            Agenda do Dia
          </h3>
          <p className="text-sm text-muted">
            {new Date(ano, mes, diaSelecionado).toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long'
            })}
          </p>
        </div>

        {agendamentosDoDiaSelecionado.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
            <div className="mb-3 rounded-full bg-surface-subtle p-4">
              <CalendarIcon className="h-8 w-8 text-faint" />
            </div>
            <p className="text-lg font-medium text-muted">Nenhum agendamento neste dia.</p>
            <p className="text-sm text-faint mt-1">Aproveite para marcar uma nova reunião.</p>
          </div>
        ) : (
          <motion.div 
            variants={listVariants}
            initial="hidden"
            animate="visible"
            key={`${ano}-${mes}-${diaSelecionado}`}
            className="flex flex-col gap-4"
          >
            {agendamentosDoDiaSelecionado.map((agendamento) => (
              <motion.div key={agendamento.id} variants={cardVariants}>
                <BookingCard
                  agendamento={agendamento}
                  sessionEmail={sessionEmail}
                  onExcluir={onExcluir}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
