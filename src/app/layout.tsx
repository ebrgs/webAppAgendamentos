import AuthProvider from "../components/AuthProvider";
import "./globals.css"; // Mantenha o seu css global

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        {/* Envolvemos o app aqui! */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}