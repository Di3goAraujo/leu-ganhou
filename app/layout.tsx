import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leu, Ganhou!',
  description: 'App de leitura infantil com área da criança e área dos pais.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
