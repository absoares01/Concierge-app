import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Soares concierge",
  description: "Assessoria de viagens Soares pelo Mundo: planejamento, pesquisas e roteiro em um só lugar.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@400..700&family=DM+Sans:opsz,wght@9..40,400..700&family=Playfair+Display:wght@400..700&display=swap"
        />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
