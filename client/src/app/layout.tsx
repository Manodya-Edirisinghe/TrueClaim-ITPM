import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ToastProvider } from '@/components/toast-provider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TrueClaim – Lost & Found',
  description: 'A comprehensive university Lost & Found web application.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ToastProvider>
          {/* TODO: Add Navbar component here */}
          <main className="min-h-screen overflow-x-hidden">
            {children}
          </main>
        </ToastProvider>
      </body>
    </html>
  );
}
