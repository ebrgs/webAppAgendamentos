// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, List as ListIcon, Calendar as CalendarIcon, Settings } from 'lucide-react';
import { toast } from 'sonner';

import { Agendamento, Sala } from '@/types';
import LoginPage from '@/components/auth/LoginPage';
import BookingModal, { BookingFormData } from '@/components/bookings/BookingModal';
import WeekView from '@/components/bookings/WeekView';
import CalendarView from '@/components/calendar/CalendarView';
import FixedMeetingModal, { AdminFormData } from '@/components/admin/FixedMeetingModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { cn } from '@/lib/cn';

const ADMIN_EMAIL = 'elias.borges@omegaservice.com.br';

const INITIAL_FORM_DATA: BookingFormData = {
  title: '', data: '', horaInicio: '', horaFim: '', roomId: '', convidados: '',
};

const INITIAL_ADMIN_FORM: AdminFormData = {
  title: '', dataInicio: '', horaInicio: '', horaFim: '', roomId: '',
};

export default function AgendamentosPage() {
  const { data: session, status } = useSession();

  // --- Estado da aplicação ---
  const [viewMode, setViewMode] = useState<'lista' | 'calendario'>('calendario');
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [salas, setSalas] = useState<Sala[]>([]);

  // --- Estado do Calendário / Semana ---
  const hoje = new Date();
  const [dataAtual, setDataAtual] = useState(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
  const [diaSelecionado, setDiaSelecionado] = useState(hoje.getDate());
  const ano = dataAtual.getFullYear();
  const mes = dataAtual.getMonth();

  const dataCompletaSelecionada = new Date(ano, mes, diaSelecionado);
  const inicioDaSemana = new Date(dataCompletaSelecionada);
  inicioDaSemana.setDate(dataCompletaSelecionada.getDate() - dataCompletaSelecionada.getDay());
  inicioDaSemana.setHours(0, 0, 0, 0);
  const fimDaSemana = new Date(inicioDaSemana);
  fimDaSemana.setDate(fimDaSemana.getDate() + 6);
  fimDaSemana.setHours(23, 59, 59, 999);
  const diasDaSemanaAtual = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicioDaSemana);
    d.setDate(d.getDate() + i);
    return d;
  });

  // --- Estado dos Modais ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<BookingFormData>(INITIAL_FORM_DATA);

  const [isModalAdminOpen, setIsModalAdminOpen] = useState(false);
  const [isAdminSubmitting, setIsAdminSubmitting] = useState(false);
  const [adminFormData, setAdminFormData] = useState<AdminFormData>(INITIAL_ADMIN_FORM);

  // --- Estado do Confirm Dialog ---
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    isDestructive?: boolean;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  // --- Carregamento inicial de dados ---
  useEffect(() => {
    async function carregarDados() {
      try {
        const resAgendamentos = await fetch('/api/bookings');
        if (!resAgendamentos.ok) throw new Error('Falha ao buscar agendamentos');
        setAgendamentos(await resAgendamentos.json());

        const resSalas = await fetch('/api/rooms');
        if (resSalas.ok) {
          const dataSalas: Sala[] = await resSalas.json();
          setSalas(dataSalas);
          if (dataSalas.length > 0) {
            setFormData((prev) => ({ ...prev, roomId: dataSalas[0].id }));
          }
        }
      } catch (err) {
        setErro('Não foi possível carregar os dados.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    carregarDados();
  }, []);

  // --- Guardas de autenticação ---
  if (status === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg">
        <div className="flex animate-pulse flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          <p className="text-sm text-muted">Carregando sistema...</p>
        </div>
      </main>
    );
  }
  if (status === 'unauthenticated') {
    return <LoginPage />;
  }

  // --- Handlers de agendamento ---
  const handleAvancar = (e: React.FormEvent) => {
    e.preventDefault();
    setModalStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const dataParts = formData.data.split('-');
      const inicioParts = formData.horaInicio.split(':');
      const fimParts = formData.horaFim.split(':');

      const start = new Date(
        parseInt(dataParts[0], 10),
        parseInt(dataParts[1], 10) - 1,
        parseInt(dataParts[2], 10),
        parseInt(inicioParts[0], 10),
        parseInt(inicioParts[1], 10),
        0
      ).toISOString();

      const end = new Date(
        parseInt(dataParts[0], 10),
        parseInt(dataParts[1], 10) - 1,
        parseInt(dataParts[2], 10),
        parseInt(fimParts[0], 10),
        parseInt(fimParts[1], 10),
        0
      ).toISOString();

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          startTime: start,
          endTime: end,
          roomId: formData.roomId,
          organizerEmail: session?.user?.email,
          participantsEmails: formData.convidados,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao agendar reunião');
      }

      const novoAgendamento: Agendamento = await response.json();
      setAgendamentos((prev) => [...prev, novoAgendamento]);
      setIsModalOpen(false);
      setModalStep(1);
      setFormData({ ...INITIAL_FORM_DATA, roomId: salas.length > 0 ? salas[0].id : '' });
      toast.success('Reunião agendada com sucesso!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao agendar reunião');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExcluir = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Cancelar agendamento',
      description: 'Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/bookings/${id}`, { method: 'DELETE' });
          if (!response.ok) throw new Error('Erro ao cancelar agendamento');
          setAgendamentos((prev) => prev.filter((ag) => ag.id !== id));
          toast.success('Agendamento cancelado com sucesso.');
        } catch (error) {
          toast.error('Não foi possível cancelar o agendamento.');
          console.error(error);
        }
      },
    });
  };

  // --- Handlers do painel Admin ---
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdminSubmitting(true);
    try {
      const dataParts = adminFormData.dataInicio.split('-');
      const horaInicioParts = adminFormData.horaInicio.split(':');
      const horaFimParts = adminFormData.horaFim.split(':');

      const dataLoopStart = new Date(
        parseInt(dataParts[0], 10),
        parseInt(dataParts[1], 10) - 1,
        parseInt(dataParts[2], 10),
        parseInt(horaInicioParts[0], 10),
        parseInt(horaInicioParts[1], 10),
        0
      ).toISOString();

      const dataLoopEnd = new Date(
        parseInt(dataParts[0], 10),
        parseInt(dataParts[1], 10) - 1,
        parseInt(dataParts[2], 10),
        parseInt(horaFimParts[0], 10),
        parseInt(horaFimParts[1], 10),
        0
      ).toISOString();

      const res = await fetch('/api/bookings/fixed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: adminFormData.title,
          roomId: adminFormData.roomId,
          startTimeIso: dataLoopStart,
          endTimeIso: dataLoopEnd,
        }),
      });
      if (!res.ok) throw new Error('Erro ao gerar série de reuniões fixas.');
      toast.success('Sucesso! 52 reuniões semanais foram agendadas no sistema.');
      setIsModalAdminOpen(false);
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsAdminSubmitting(false);
    }
  };

  const handleAdminDelete = () => {
    if (!adminFormData.title || !adminFormData.roomId) {
      toast.error('Para apagar uma série, preencha o Nome Exato e selecione a Sala corretamente.');
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: 'Apagar Série Fixa',
      description: `Tem certeza que deseja APAGAR todas as 52 reuniões fixas com o nome "${adminFormData.title}" nesta sala?`,
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await fetch('/api/bookings/fixed', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: `${adminFormData.title}`, roomId: adminFormData.roomId }),
          });
          if (!res.ok) throw new Error('Erro ao apagar série.');
          const dados = await res.json();
          toast.success(`Sucesso! Foram removidos ${dados.count} agendamentos fixos.`);
          setIsModalAdminOpen(false);
          setTimeout(() => window.location.reload(), 1500);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Erro desconhecido');
        }
      },
    });
  };

  // --- Navegação semanal ---
  const irParaSemanaAnterior = () => {
    const novaData = new Date(ano, mes, diaSelecionado - 7);
    setDataAtual(novaData);
    setDiaSelecionado(novaData.getDate());
  };

  const irParaProximaSemana = () => {
    const novaData = new Date(ano, mes, diaSelecionado + 7);
    setDataAtual(novaData);
    setDiaSelecionado(novaData.getDate());
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-bg flex flex-col font-sans">
      {/* Header Sticky com Frosted Glass */}
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface/80 px-6 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Agenda de Salas
          </h1>
          <div className="hidden sm:flex rounded-lg bg-surface-subtle p-1 shadow-sm border border-border-subtle">
            <button
              onClick={() => setViewMode('lista')}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200',
                viewMode === 'lista'
                  ? 'bg-surface text-foreground shadow-card'
                  : 'text-muted hover:text-foreground'
              )}
            >
              <ListIcon className="h-4 w-4" />
              Lista
            </button>
            <button
              onClick={() => setViewMode('calendario')}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200',
                viewMode === 'calendario'
                  ? 'bg-surface text-foreground shadow-card'
                  : 'text-muted hover:text-foreground'
              )}
            >
              <CalendarIcon className="h-4 w-4" />
              Calendário
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {session?.user?.email === ADMIN_EMAIL && (
            <button
              onClick={() => {
                if (salas.length > 0) setAdminFormData((prev) => ({ ...prev, roomId: salas[0].id }));
                setIsModalAdminOpen(true);
              }}
              className="hidden sm:flex items-center gap-2 rounded-md bg-surface px-3 py-1.5 text-sm font-medium text-foreground border border-border shadow-sm transition-colors hover:bg-surface-subtle"
            >
              <Settings className="h-4 w-4" />
              Configurar Reuniões Fixas
            </button>
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            className="hidden sm:flex items-center gap-2 rounded-md bg-brand px-4 py-1.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-dark active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Novo Agendamento
          </button>
        </div>
      </header>

      {/* Toggle View Mobile (aparece apenas em telas pequenas) */}
      <div className="flex sm:hidden justify-center p-4">
        <div className="flex w-full max-w-[300px] rounded-lg bg-surface-subtle p-1 shadow-sm border border-border-subtle">
          <button
            onClick={() => setViewMode('lista')}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200',
              viewMode === 'lista'
                ? 'bg-surface text-foreground shadow-card'
                : 'text-muted hover:text-foreground'
            )}
          >
            Lista
          </button>
          <button
            onClick={() => setViewMode('calendario')}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200',
              viewMode === 'calendario'
                ? 'bg-surface text-foreground shadow-card'
                : 'text-muted hover:text-foreground'
            )}
          >
            Calendário
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 md:py-8">
        <div className="mx-auto max-w-6xl">
          {loading ? (
            <div className="flex h-[400px] items-center justify-center rounded-xl border border-border bg-surface shadow-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                <span className="text-sm text-muted">Carregando calendário...</span>
              </div>
            </div>
          ) : erro ? (
            <div className="flex h-[400px] items-center justify-center rounded-xl border border-danger-subtle bg-surface shadow-sm">
              <p className="text-sm text-danger">{erro}</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {viewMode === 'lista' ? (
                <motion.div
                  key="lista"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <WeekView
                    agendamentos={agendamentos}
                    diasDaSemanaAtual={diasDaSemanaAtual}
                    inicioDaSemana={inicioDaSemana}
                    fimDaSemana={fimDaSemana}
                    sessionEmail={session?.user?.email}
                    onExcluir={handleExcluir}
                    onSemanaAnterior={irParaSemanaAnterior}
                    onProximaSemana={irParaProximaSemana}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="calendario"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <CalendarView
                    agendamentos={agendamentos}
                    dataAtual={dataAtual}
                    diaSelecionado={diaSelecionado}
                    sessionEmail={session?.user?.email}
                    onDiaClick={setDiaSelecionado}
                    onMesAnterior={() => setDataAtual(new Date(ano, mes - 1, 1))}
                    onProximoMes={() => setDataAtual(new Date(ano, mes + 1, 1))}
                    onExcluir={handleExcluir}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </main>

      {/* FAB Mobile */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-raised transition-colors hover:bg-brand-dark sm:hidden z-50"
      >
        <Plus className="h-6 w-6" />
      </motion.button>
      
      {session?.user?.email === ADMIN_EMAIL && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (salas.length > 0) setAdminFormData((prev) => ({ ...prev, roomId: salas[0].id }));
            setIsModalAdminOpen(true);
          }}
          className="fixed bottom-24 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-surface border border-border text-foreground shadow-raised transition-colors hover:bg-surface-subtle sm:hidden z-50"
        >
          <Settings className="h-5 w-5" />
        </motion.button>
      )}

      {/* Modais Globais */}
      <BookingModal
        isOpen={isModalOpen}
        modalStep={modalStep}
        isSubmitting={isSubmitting}
        formData={formData}
        salas={salas}
        sessionEmail={session?.user?.email}
        onFormChange={(updates) => setFormData((prev) => ({ ...prev, ...updates }))}
        onAvancar={handleAvancar}
        onSubmit={handleSubmit}
        onClose={() => { setIsModalOpen(false); setModalStep(1); }}
        onBack={() => setModalStep(1)}
      />

      <FixedMeetingModal
        isOpen={isModalAdminOpen}
        isSubmitting={isAdminSubmitting}
        formData={adminFormData}
        salas={salas}
        onFormChange={(updates) => setAdminFormData((prev) => ({ ...prev, ...updates }))}
        onSubmit={handleAdminSubmit}
        onDelete={handleAdminDelete}
        onClose={() => setIsModalAdminOpen(false)}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.description}
        isDestructive={confirmDialog.isDestructive}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}