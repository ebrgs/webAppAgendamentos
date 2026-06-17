// src/components/bookings/BookingModal.tsx
import { Sala } from '@/types';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar as CalendarIcon, Clock, Users, ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface BookingFormData {
  title: string;
  data: string;
  horaInicio: string;
  horaFim: string;
  roomId: string;
  convidados: string;
}

interface BookingModalProps {
  isOpen: boolean;
  modalStep: 1 | 2;
  isSubmitting: boolean;
  formData: BookingFormData;
  salas: Sala[];
  sessionEmail?: string | null;
  onFormChange: (updates: Partial<BookingFormData>) => void;
  onAvancar: (e: React.FormEvent) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  onBack: () => void;
}

export default function BookingModal({
  isOpen,
  modalStep,
  isSubmitting,
  formData,
  salas,
  sessionEmail,
  onFormChange,
  onAvancar,
  onSubmit,
  onClose,
  onBack,
}: BookingModalProps) {
  // Configurações de animação (slide-up no mobile, scale no desktop)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  
  const contentVariants = {
    hidden: isMobile 
      ? { opacity: 0, y: '100%' } 
      : { opacity: 0, scale: 0.95, y: '-50%', x: '-50%' },
    visible: isMobile 
      ? { opacity: 1, y: 0 } 
      : { opacity: 1, scale: 1, y: '-50%', x: '-50%' },
    exit: isMobile 
      ? { opacity: 0, y: '100%' } 
      : { opacity: 0, scale: 0.95, y: '-50%', x: '-50%' }
  };

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
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                className={cn(
                  "fixed z-50 bg-surface shadow-modal focus:outline-none flex flex-col",
                  isMobile
                    ? "bottom-0 left-0 right-0 max-h-[90vh] rounded-t-[var(--radius-lg)] pb-8 pt-6"
                    : "top-1/2 left-1/2 w-full max-w-lg rounded-[var(--radius-lg)] p-6"
                )}
              >
                {isMobile && (
                  <div className="absolute left-1/2 top-3 h-1 w-12 -translate-x-1/2 rounded-full bg-border" />
                )}
                
                <div className={cn("flex items-center justify-between mb-6", isMobile && "px-6")}>
                  <div>
                    <Dialog.Title className="text-xl font-semibold text-foreground">
                      {modalStep === 1 ? 'Novo Agendamento' : 'Confirmar Detalhes'}
                    </Dialog.Title>
                    <Dialog.Description className="mt-1 text-sm text-muted">
                      {modalStep === 1 ? 'Preencha os dados da reunião.' : 'Revise antes de salvar.'}
                    </Dialog.Description>
                  </div>
                  <Dialog.Close asChild>
                    <button className="rounded-full p-2 text-muted transition-colors hover:bg-surface-subtle focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2">
                      <X className="h-5 w-5" />
                    </button>
                  </Dialog.Close>
                </div>

                <div className={cn("overflow-y-auto flex-1", isMobile && "px-6")}>
                  {modalStep === 1 ? (
                    <form id="booking-form-step1" onSubmit={onAvancar} className="space-y-4">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                          Título da Reunião
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Alinhamento Semanal"
                          value={formData.title}
                          onChange={(e) => onFormChange({ title: e.target.value })}
                          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground placeholder:text-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-subtle"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                          Sala
                        </label>
                        <select
                          required
                          value={formData.roomId}
                          onChange={(e) => onFormChange({ roomId: e.target.value })}
                          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-subtle"
                        >
                          {salas.map((sala) => (
                            <option key={sala.id} value={sala.id}>
                              {sala.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1">
                          <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Data
                          </label>
                          <div className="relative">
                            <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                            <input
                              type="date"
                              required
                              value={formData.data}
                              onChange={(e) => onFormChange({ data: e.target.value })}
                              className="w-full rounded-md border border-border bg-surface pl-9 pr-3 py-2 text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-subtle"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 col-span-2 sm:col-span-1">
                          <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                              Início
                            </label>
                            <input
                              type="time"
                              required
                              value={formData.horaInicio}
                              onChange={(e) => onFormChange({ horaInicio: e.target.value })}
                              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-subtle"
                            />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                              Fim
                            </label>
                            <input
                              type="time"
                              required
                              value={formData.horaFim}
                              onChange={(e) => onFormChange({ horaFim: e.target.value })}
                              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-subtle"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                          Convidados (Emails separados por vírgula)
                        </label>
                        <div className="relative">
                          <Users className="absolute left-3 top-3 h-4 w-4 text-muted" />
                          <textarea
                            rows={2}
                            placeholder="email1@empresa.com, email2@empresa.com"
                            value={formData.convidados}
                            onChange={(e) => onFormChange({ convidados: e.target.value })}
                            className="w-full rounded-md border border-border bg-surface pl-9 pr-3 py-2 text-foreground placeholder:text-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-subtle resize-none"
                          />
                        </div>
                        <p className="mt-1 text-xs text-faint">Opcional. Eles receberão um invite.</p>
                      </div>
                    </form>
                  ) : (
                    <form id="booking-form-step2" onSubmit={onSubmit} className="space-y-4">
                      <div className="rounded-lg bg-surface-subtle p-4 border border-border-subtle">
                        <h4 className="font-semibold text-foreground mb-3 border-b border-border-subtle pb-2">
                          Resumo da Reunião
                        </h4>
                        <dl className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <dt className="text-muted">Título:</dt>
                            <dd className="font-medium text-foreground">{formData.title}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted">Sala:</dt>
                            <dd className="font-medium text-foreground">
                              {salas.find((s) => s.id === formData.roomId)?.name || formData.roomId}
                            </dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted">Quando:</dt>
                            <dd className="font-medium text-foreground">
                              {formData.data.split('-').reverse().join('/')} das {formData.horaInicio} às {formData.horaFim}
                            </dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted">Organizador:</dt>
                            <dd className="font-medium text-foreground">{sessionEmail}</dd>
                          </div>
                          {formData.convidados && (
                            <div className="flex justify-between border-t border-border-subtle mt-2 pt-2">
                              <dt className="text-muted">Convidados:</dt>
                              <dd className="text-right text-foreground max-w-[200px] truncate" title={formData.convidados}>
                                {formData.convidados.split(',').length} pessoa(s)
                              </dd>
                            </div>
                          )}
                        </dl>
                      </div>
                    </form>
                  )}
                </div>

                <div className={cn("mt-6 flex justify-end gap-3", isMobile && "px-6")}>
                  {modalStep === 1 ? (
                    <>
                      <Dialog.Close asChild>
                        <button type="button" className="rounded-md px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-subtle transition-colors">
                          Cancelar
                        </button>
                      </Dialog.Close>
                      <button
                        type="submit"
                        form="booking-form-step1"
                        className="flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
                      >
                        Avançar <ArrowRight className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={onBack}
                        disabled={isSubmitting}
                        className="rounded-md px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-subtle transition-colors disabled:opacity-50"
                      >
                        Voltar
                      </button>
                      <button
                        type="submit"
                        form="booking-form-step2"
                        disabled={isSubmitting}
                        className="flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        {isSubmitting ? 'Salvando...' : 'Confirmar Agendamento'}
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
