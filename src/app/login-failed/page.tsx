import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import Link from 'next/link'

export default function LoginFailed() {
  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen font-sans">
      <Navigation variant="dark" />

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-display font-bold text-white">Access Restricted</h2>
            <p className="mt-4 text-gray-300">The Investor Portal is currently available by invitation only.</p>
          </div>

          {/* Content Card */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-xl p-8 border border-slate-700">
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-white mb-4">Portal Access</h3>
                <p className="text-gray-300 mb-6">
                  Our secure investor portal provides qualified investors with access to:
                </p>
              </div>
              
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-gold-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Property performance reports
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-gold-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Financial statements and distributions
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-gold-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Investment opportunity updates
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-gold-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Direct communication with management
                </li>
              </ul>
              
              <div className="border-t pt-6 space-y-4 border-slate-600">
                <div className="text-center">
                  <p className="text-sm text-gray-300 mb-4">
                    For general inquiries about Idlewood Capital?
                  </p>
                  <Link 
                    href="/#contact" 
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200"
                  >
                    Contact Us
                  </Link>
                </div>
                
                <div className="text-center">
                  <Link 
                    href="/investor-portal" 
                    className="inline-flex items-center px-4 py-2 border border-slate-600 text-gray-300 font-medium rounded-lg hover:bg-slate-700/50 transition-colors"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Login
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          {/* Additional Info */}
          <div className="text-center text-sm text-gray-400">
            <p>
              Current investors should contact{' '}
              <a href="mailto:info@idlewoodcapital.com" className="text-gold-500 hover:text-gold-600 font-medium">
                info@idlewoodcapital.com
              </a>{' '}
              for portal access credentials.
            </p>
          </div>
        </div>
      </div>

      <Footer variant="minimal" />
    </div>
  )
}