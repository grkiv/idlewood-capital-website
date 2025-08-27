import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login Failed - Idlewood Capital',
  description: 'Login attempt failed - Idlewood Capital Investor Portal.',
  robots: 'noindex, nofollow', // Error pages should not be indexed
}

export default function LoginFailedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}