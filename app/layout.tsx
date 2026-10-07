import type { Metadata } from "next";
import "./globals.css";
import { withBase } from '@/lib/paths';

export const metadata: Metadata = {
  title: "Controle de Coberturas",
  description: "Preenchimento de coberturas pelos supervisores e prestação de contas em Excel.",
  icons: {
    icon: withBase('/favicon.svg'),
    shortcut: withBase('/favicon.svg'),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
