import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ARB/TC',
  description: 'Cauciones tomadoras y CEDEARs en D',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
