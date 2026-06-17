import { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDestructive = false,
}: ConfirmDialogProps) {
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
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-md)] bg-surface p-6 shadow-modal focus:outline-none"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                      isDestructive ? 'bg-danger-subtle text-danger' : 'bg-brand-subtle text-brand'
                    )}
                  >
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <Dialog.Title className="text-lg font-semibold text-foreground">
                      {title}
                    </Dialog.Title>
                    <Dialog.Description className="mt-2 text-sm text-muted">
                      {description}
                    </Dialog.Description>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={onClose}
                    className="rounded-md px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-subtle"
                  >
                    {cancelText}
                  </button>
                  <button
                    onClick={() => {
                      onConfirm();
                      onClose();
                    }}
                    className={cn(
                      'rounded-md px-4 py-2 text-sm font-medium text-white transition-colors',
                      isDestructive ? 'bg-danger hover:bg-danger-text' : 'bg-brand hover:bg-brand-dark'
                    )}
                  >
                    {confirmText}
                  </button>
                </div>
                <Dialog.Close asChild>
                  <button
                    className="absolute right-4 top-4 rounded-full p-1 text-muted transition-colors hover:bg-surface-subtle"
                    aria-label="Fechar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </Dialog.Close>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
