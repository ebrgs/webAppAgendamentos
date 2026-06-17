import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import AuthProvider from '../components/AuthProvider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter', // expõe como variável CSS para o @theme do Tailwind v4
});

export const metadata: Metadata = {
  title: 'Agenda de Salas — Omega Service',
  description: 'Sistema corporativo de agendamento de salas de reunião da Omega Service.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="antialiased bg-bg font-sans text-foreground">
        <AuthProvider>{children}</AuthProvider>
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{ className: 'font-sans text-sm' }}
        />
      </body>
    </html>
  );
}