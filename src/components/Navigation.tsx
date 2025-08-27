'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

interface NavigationProps {
  variant?: 'light' | 'dark'
}

export default function Navigation({ variant = 'light' }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const isDark = variant === 'dark'
  const bgClass = isDark ? 'bg-slate-800/90 backdrop-blur-sm border-slate-700' : 'bg-white/95 backdrop-blur-lg border-gray-200'
  const textClass = isDark ? 'text-white' : 'text-gray-900'
  const linkClass = isDark ? 'text-gray-300 hover:text-gold-500' : 'text-gray-700 hover:text-gold-500'
  const logoFilter = isDark ? 'filter brightness-0 invert' : ''

  return (
    <nav className={`fixed top-0 left-0 right-0 ${bgClass} border-b z-50`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <Image
                src="/assets/images/logo.svg"
                alt="Idlewood Capital"
                width={48}
                height={48}
                className={`h-12 w-auto ${logoFilter}`}
              />
              <div className="flex flex-col">
                <span className={`font-display text-xl font-bold ${textClass}`}>IDLEWOOD</span>
                <span className="text-xs font-semibold tracking-wider text-gold-500">CAPITAL</span>
              </div>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className={`${linkClass} font-medium transition-colors`}>Home</Link>
            <Link href="/#about" className={`${linkClass} font-medium transition-colors`}>About</Link>
            <Link href="/#portfolio" className={`${linkClass} font-medium transition-colors`}>Portfolio</Link>
            <Link href="/#team" className={`${linkClass} font-medium transition-colors`}>Team</Link>
            <Link href="/#contact" className={`${linkClass} font-medium transition-colors`}>Contact</Link>
            <Link 
              href="/investor-portal" 
              className="ml-4 px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:from-gold-600 hover:to-gold-700 transform hover:-translate-y-1 transition-all duration-200 border-2 border-gold-400"
            >
              Investor Portal
            </Link>
          </div>
          
          {/* Mobile menu button */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2"
          >
            <svg className={`h-6 w-6 ${isDark ? 'text-white' : 'text-gray-700'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        
        {/* Mobile Navigation */}
        <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden pb-4`}>
          <div className="flex flex-col space-y-3">
            <Link href="/" className={`${linkClass} font-medium transition-colors`}>Home</Link>
            <Link href="/#about" className={`${linkClass} font-medium transition-colors`}>About</Link>
            <Link href="/#portfolio" className={`${linkClass} font-medium transition-colors`}>Portfolio</Link>
            <Link href="/#team" className={`${linkClass} font-medium transition-colors`}>Team</Link>
            <Link href="/#contact" className={`${linkClass} font-medium transition-colors`}>Contact</Link>
            <Link 
              href="/investor-portal" 
              className="mt-2 px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-600 text-white font-semibold rounded-lg shadow-lg border-2 border-gold-400 text-center"
            >
              Investor Portal
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}