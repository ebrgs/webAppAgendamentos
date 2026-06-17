// src/components/admin/FixedMeetingModal.tsx
import { Sala } from '@/types';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Trash2, CalendarCheck } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface AdminFormData {
  title: string;
  dataInicio: string;
  horaInicio: string;
  horaFim: string;
  roomId: string;
}

interface FixedMeetingModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  formData: AdminFormData;
  salas: Sala[];
  onFormChange: (updates: Partial<AdminFormData>) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onDelete: () => void;
  onClose: () => void;
}

export default function FixedMeetingModal({
  isOpen,
  isSubmitting,
  formData,
  salas,
  onFormChange,
  onSubmit,
  onDelete,
  onClose,
}: FixedMeetingModalProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-surface shadow-modal focus:outline-none flex flex-col"
              >
                <div className="flex items-center justify-between border-b border-border px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-danger-subtle text-danger">
                      <Settings className="h-5 w-5" />
                    </div>
                    <div>
                      <Dialog.Title className="text-lg font-semibold text-foreground">
                        Reuniões Fixas
                      </Dialog.Title>
                      <Dialog.Description className="text-xs text-muted">
                        Agendamentos para 1 Ano (52 Semanas)
                      </Dialog.Description>
                    </div>
                  </div>
                  <Dialog.Close asChild>
                    <button className="rounded-full p-2 text-muted transition-colors hover:bg-surface-subtle focus:outline-none focus:ring-2 focus:ring-danger focus:ring-offset-2">
                      <X className="h-5 w-5" />
                    </button>
                  </Dialog.Close>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-6">
                  <div className="mb-6 rounded-lg bg-danger-subtle p-4 border border-danger/20">
                    <p className="text-sm text-danger-text">
                      <strong className="block mb-1">⚠️ Atenção, Administrador:</strong>
                      As ações realizadas aqui vão criar ou remover <strong>52 agendamentos</strong> em sequência no calendário, bloqueando a sala em todos esses horários.
                    </p>
                  </div>

                  <form id="admin-form" onSubmit={onSubmit} className="space-y-5">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-foreground">
                        Título do Horário Fixo
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Reunião de Alinhamento Diretoria"
                        value={formData.title}
                        onChange={(e) => onFormChange({ title: e.target.value })}
                        required
                        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground placeholder:text-faint focus:border-danger focus:outline-none focus:ring-2 focus:ring-danger-subtle"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-foreground">
                        Sala de Destino
                      </label>
                      <select
                        value={formData.roomId}
                        onChange={(e) => onFormChange({ roomId: e.target.value })}
                        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground focus:border-danger focus:outline-none focus:ring-2 focus:ring-danger-subtle"
                      >
                        {salas.map((sala) => (
                          <option key={sala.id} value={sala.id}>
                            {sala.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-foreground">
                        Data da Primeira Reunião
                      </label>
                      <input
                        type="date"
                        value={formData.dataInicio}
                        onChange={(e) => onFormChange({ dataInicio: e.target.value })}
                        required
                        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground focus:border-danger focus:outline-none focus:ring-2 focus:ring-danger-subtle"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">Início</label>
                        <input
                          type="time"
                          value={formData.horaInicio}
                          onChange={(e) => onFormChange({ horaInicio: e.target.value })}
                          required
                          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground focus:border-danger focus:outline-none focus:ring-2 focus:ring-danger-subtle"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">Fim</label>
                        <input
                          type="time"
                          value={formData.horaFim}
                          onChange={(e) => onFormChange({ horaFim: e.target.value })}
                          required
                          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground focus:border-danger focus:outline-none focus:ring-2 focus:ring-danger-subtle"
                        />
                      </div>
                    </div>
                  </form>
                </div>

                <div className="border-t border-border px-6 py-5 bg-surface-subtle flex flex-col gap-3">
                  <button
                    type="submit"
                    form="admin-form"
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-md bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <CalendarCheck className="h-4 w-4" />
                    )}
                    {isSubmitting ? 'Gerando 52 semanas...' : 'Salvar e Bloquear 52 Semanas'}
                  </button>

                  <button
                    type="button"
                    onClick={onDelete}
                    className="flex w-full items-center justify-center gap-2 rounded-md border border-danger text-danger bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-danger hover:text-white focus:outline-none focus:ring-2 focus:ring-danger focus:ring-offset-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Apagar Série com este Nome
                  </button>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
