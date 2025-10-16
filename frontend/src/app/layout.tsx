import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import { Toaster } from 'sonner';
import { ConvexClientProvider } from '@/providers/ConvexClientProvider';
import { HydrationBoundary } from '@/components/ui/HydrationBoundary';
import { HydrationErrorBoundary } from '@/components/ui/ErrorBoundary';
import { HydrationInitializer } from '@/components/ui/HydrationInitializer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'OAuth 2.1 MCP Gateway - Secure Authentication for MCP Servers',
  description:
    'Enterprise-grade OAuth 2.1 authentication gateway for Model Context Protocol servers. Secure, scalable, and compliant.',
  keywords: 'OAuth 2.1, MCP, Model Context Protocol, Authentication, API Gateway, Security',
  authors: [{ name: 'OAuth MCP Gateway Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#9FE870' },
    { media: '(prefers-color-scheme: dark)', color: '#163300' },
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'OAuth 2.1 MCP Gateway',
    title: 'OAuth 2.1 MCP Gateway - Secure Authentication for MCP Servers',
    description:
      'Enterprise-grade OAuth 2.1 authentication gateway for Model Context Protocol servers.',
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'OAuth 2.1 MCP Gateway',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OAuth 2.1 MCP Gateway',
    description: 'Enterprise-grade OAuth 2.1 authentication gateway for MCP servers.',
    images: [`${process.env.NEXT_PUBLIC_APP_URL}/twitter-image.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png' }],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#9FE870',
      },
    ],
  },
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: '#1DB954',
          colorText: '#163300',
          colorTextSecondary: '#6b7280',
          colorBackground: '#ffffff',
          colorInputBackground: '#ffffff',
          colorInputText: '#163300',
          colorDanger: '#ef4444',
          colorSuccess: '#22c55e',
          colorWarning: '#f59e0b',
          colorNeutral: '#6b7280',
          fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
          fontFamilyButtons: '"Inter", system-ui, -apple-system, sans-serif',
          fontSize: '16px',
          fontWeight: {
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
          },
          borderRadius: '8px',
          spacingUnit: '4px',
        },
        elements: {
          formButtonPrimary: {
            backgroundColor: '#1DB954',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: '#16a34a',
            },
            '&:focus': {
              boxShadow: '0 0 0 3px rgba(29, 185, 84, 0.2)',
            },
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: '600',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          },
          formFieldInput: {
            borderColor: '#d1d5db',
            borderRadius: '8px',
            fontSize: '16px',
            padding: '12px',
            '&:hover': {
              borderColor: '#9ca3af',
            },
            '&:focus': {
              borderColor: '#1DB954',
              boxShadow: '0 0 0 3px rgba(29, 185, 84, 0.1)',
            },
          },
          formFieldLabel: {
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '4px',
          },
          card: {
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            border: '1px solid #e5e7eb',
          },
          headerTitle: {
            fontSize: '24px',
            fontWeight: '600',
            color: '#163300',
          },
          headerSubtitle: {
            fontSize: '16px',
            color: '#6b7280',
          },
          socialButtonsBlockButton: {
            borderColor: '#e5e7eb',
            borderRadius: '8px',
            '&:hover': {
              backgroundColor: '#f9fafb',
              borderColor: '#d1d5db',
            },
          },
          dividerLine: {
            backgroundColor: '#e5e7eb',
          },
          dividerText: {
            color: '#9ca3af',
            fontSize: '14px',
          },
          footerActionLink: {
            color: '#1DB954',
            fontSize: '14px',
            fontWeight: '500',
            '&:hover': {
              color: '#16a34a',
            },
          },
          identityPreviewText: {
            fontSize: '14px',
            color: '#374151',
          },
          identityPreviewEditButton: {
            color: '#1DB954',
            '&:hover': {
              color: '#16a34a',
            },
          },
          formHeaderTitle: {
            fontSize: '20px',
            fontWeight: '600',
            color: '#163300',
          },
          formHeaderSubtitle: {
            fontSize: '14px',
            color: '#6b7280',
          },
          alertText: {
            fontSize: '14px',
          },
          badge: {
            backgroundColor: '#dcfce7',
            color: '#14532d',
            borderRadius: '4px',
            padding: '2px 8px',
            fontSize: '12px',
            fontWeight: '500',
          },
        },
        layout: {
          socialButtonsVariant: 'iconButton',
          logoPlacement: 'inside',
          showOptionalFields: true,
          shimmer: true,
          animations: true,
          socialButtonsPlacement: 'bottom',
        },
      }}
    >
      <html lang='en' className={`${inter.variable} font-sans`}>
        <body
          className='min-h-screen bg-white text-wise-gray-900 antialiased'
          suppressHydrationWarning
        >
          <HydrationErrorBoundary>
            <HydrationBoundary>
              <HydrationInitializer />
              <ConvexClientProvider>{children}</ConvexClientProvider>
              <Toaster
                position='bottom-right'
                toastOptions={{
                  style: {
                    background: '#ffffff',
                    color: '#163300',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
                  },
                  className: 'wise-toast',
                  duration: 4000,
                }}
              />
            </HydrationBoundary>
          </HydrationErrorBoundary>
        </body>
      </html>
    </ClerkProvider>
  );
}
