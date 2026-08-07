import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'OAuth 2.1 MCP Gateway',
  description:
    'Self-hosted OAuth 2.1 authentication gateway for Model Context Protocol servers.',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' className={`${inter.variable} font-sans`} suppressHydrationWarning>
      <body
        className='min-h-screen bg-white text-wise-gray-900 antialiased'
        suppressHydrationWarning
      >
        {children}
        <Toaster position='bottom-right' />
      </body>
    </html>
  );
}
