// src/components/auth/LoginPage.tsx
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Calendar, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      const res = await signIn('email', { email, redirect: false });

      if (res?.error) {
        toast.error('Erro ao enviar o link de acesso. Verifique o console.');
      } else {
        toast.success('Pronto! Enviamos um link mágico para o seu e-mail.');
        setEmail('');
      }
    } catch (error) {
      toast.error('Erro de conexão ao tentar fazer login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
        className="w-full max-w-md rounded-2xl bg-surface p-8 shadow-raised border border-border"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-subtle text-brand shadow-sm">
            <Calendar className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Agenda de Salas
          </h2>
          <p className="mt-2 text-sm text-muted">
            Omega Service Corporate
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              E-mail Corporativo
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@omegaservice.com.br"
                className="block w-full rounded-lg border border-border bg-surface px-4 py-3 text-foreground placeholder:text-faint focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand-subtle transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !email}
            className="group relative flex w-full justify-center items-center gap-2 rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                Receber Magic Link
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 border-t border-border-subtle pt-6 text-center">
          <p className="text-xs text-faint">
            O acesso é restrito a colaboradores da Omega Service.
            Você receberá um link de acesso seguro (sem senha).
          </p>
        </div>
      </motion.div>
    </div>
  );
}
