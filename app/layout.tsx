import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Canvas da clínica — Ateliê de ideias",
  description: "Mapa mental editável para organizar o projeto de marketing da clínica.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
