import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Investor Portal - Idlewood Capital',
  description: 'Secure investor portal for Idlewood Capital partners and stakeholders.',
  robots: 'noindex, nofollow', // Private portal should not be indexed
}

export default function InvestorPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}