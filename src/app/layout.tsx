import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth/context'

export const metadata: Metadata = {
  title: 'Idlewood Capital - Premier Real Estate Investment',
  description: 'Idlewood Capital is a premier private equity real estate investment firm specializing in value creation through strategic acquisitions and development.',
  keywords: ['real estate investment', 'private equity', 'retail properties', 'Southeast markets', 'value creation'],
  authors: [{ name: 'Idlewood Capital' }],
  openGraph: {
    title: 'Idlewood Capital - Premier Real Estate Investment',
    description: 'Premier private equity real estate investment firm specializing in value creation through strategic acquisitions and development.',
    siteName: 'Idlewood Capital',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Idlewood Capital - Premier Real Estate Investment',
    description: 'Premier private equity real estate investment firm specializing in value creation through strategic acquisitions and development.',
  },
  icons: {
    icon: '/assets/images/logo.svg',
    shortcut: '/assets/images/logo.svg',
    apple: '/assets/images/logo.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-white text-gray-900 font-sans">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}