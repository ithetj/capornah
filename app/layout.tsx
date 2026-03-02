import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import './globals.css';
import Navigation from '@/components/Navigation';

export const metadata: Metadata = {
  title: 'CAPORNAH - Text Vibe Scanner',
  description: 'Text pattern entertainment. For the plot. 🍿',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={GeistSans.className}>
      <body>
        <Navigation />
        {children}
      </body>
    </html>
  );
}