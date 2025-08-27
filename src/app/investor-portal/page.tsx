'use client'

import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'
import { AuthErrorCode } from '@/lib/types/auth'

export default function InvestorPortal() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false
  })
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { login, user, isAuthenticated } = useAuth()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    // Clear error when user starts typing
    if (error) {
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Client-side validation
    if (!formData.email || !formData.password) {
      setError('Please enter both email and password.')
      setIsLoading(false)
      return
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.')
      setIsLoading(false)
      return
    }

    try {
      const result = await login(formData.email, formData.password, formData.remember)
      
      if (result.success) {
        // Redirect to dashboard on successful login
        router.push('/dashboard')
      } else {
        // Handle login failure
        if (result.message) {
          setError(result.message)
        } else {
          setError('Login failed. Please check your credentials and try again.')
        }
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen font-sans">
      <Navigation variant="dark" />

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-gold-500 rounded-full flex items-center justify-center mb-6">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-3xl font-display font-bold text-white">Investor Portal</h2>
            <p className="mt-4 text-gray-300">Sign in to access your investor dashboard</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-xl p-8 border border-slate-700">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input 
                  id="email" 
                  name="email" 
                  type="email" 
                  required 
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none transition-colors placeholder-gray-400"
                  placeholder="Enter your email"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input 
                  id="password" 
                  name="password" 
                  type="password" 
                  required 
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none transition-colors placeholder-gray-400"
                  placeholder="Enter your password"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input 
                    id="remember" 
                    name="remember" 
                    type="checkbox" 
                    checked={formData.remember}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-gold-500 focus:ring-gold-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember" className="ml-2 block text-sm text-gray-300">
                    Remember me
                  </label>
                </div>
                
                <div className="text-sm">
                  <a href="mailto:info@idlewoodcapital.com?subject=Password Reset Request" className="font-medium text-gold-500 hover:text-gold-600">
                    Forgot password?
                  </a>
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={isLoading}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 transition-all duration-200 ${
                  isLoading 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 transform hover:-translate-y-1'
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          </div>
          
          {/* Portal Features */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4 text-center">Portal Access Includes</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-center">
                <svg className="h-4 w-4 text-gold-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Property performance reports and analytics
              </li>
              <li className="flex items-center">
                <svg className="h-4 w-4 text-gold-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Financial statements and distribution history
              </li>
              <li className="flex items-center">
                <svg className="h-4 w-4 text-gold-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                New investment opportunity notifications
              </li>
              <li className="flex items-center">
                <svg className="h-4 w-4 text-gold-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Direct messaging with management team
              </li>
            </ul>
          </div>
          
          {/* Contact Info */}
          <div className="text-center text-sm text-gray-400">
            <p>
              For inquiries about Idlewood Capital, please{' '}
              <Link href="/#contact" className="text-gold-500 hover:text-gold-600 font-medium">
                contact us
              </Link>{' '}
              through our main website.
            </p>
          </div>
        </div>
      </div>

      <Footer variant="minimal" />
    </div>
  )
}