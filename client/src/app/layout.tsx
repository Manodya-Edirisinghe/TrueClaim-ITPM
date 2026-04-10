import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ToastProvider } from '@/components/toast-provider';
import { NotificationProvider } from '@/components/notifications/notification-provider';
import Navbar from '@/components/ui/navbar';
import SessionBootstrap from '@/components/auth/session-bootstrap';
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
          <NotificationProvider>
            <SessionBootstrap />
            <Navbar />
            <main className="min-h-screen overflow-x-hidden">
              {children}
            </main>
          </NotificationProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
