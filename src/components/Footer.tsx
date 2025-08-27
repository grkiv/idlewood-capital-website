import Link from 'next/link'
import Image from 'next/image'

interface FooterProps {
  variant?: 'full' | 'minimal'
}

export default function Footer({ variant = 'full' }: FooterProps) {
  if (variant === 'minimal') {
    return (
      <footer className="bg-gray-900 text-white py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <Image
                src="/assets/images/logo.svg"
                alt="Idlewood Capital"
                width={32}
                height={32}
                className="h-8 w-auto filter brightness-0 invert"
              />
              <div>
                <div className="font-display font-bold">IDLEWOOD</div>
                <div className="text-xs font-semibold tracking-wider text-gold-500">CAPITAL</div>
              </div>
            </div>
            <p className="text-gray-400 text-sm">© 2025 Idlewood Capital. All rights reserved.</p>
          </div>
        </div>
      </footer>
    )
  }

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/assets/images/logo.svg"
                alt="Idlewood Capital"
                width={40}
                height={40}
                className="h-10 w-auto filter brightness-0 invert"
              />
              <div>
                <div className="font-display text-xl font-bold">IDLEWOOD</div>
                <div className="text-xs font-semibold tracking-wider text-gold-500">CAPITAL</div>
              </div>
            </div>
            <p className="text-gray-400 text-sm">
              Idlewood Capital is a real estate investment firm specializing in retail properties, 
              creating durable value through disciplined acquisitions, strategic repositioning, and active management.
            </p>
          </div>
          
          {/* Company Links */}
          <div>
            <h5 className="font-semibold text-gold-500 mb-4">Company</h5>
            <ul className="space-y-2 text-sm">
              <li><Link href="/#about" className="text-gray-400 hover:text-gold-500 transition-colors">About</Link></li>
              <li><Link href="/#portfolio" className="text-gray-400 hover:text-gold-500 transition-colors">Portfolio</Link></li>
              <li><Link href="/#team" className="text-gray-400 hover:text-gold-500 transition-colors">Team</Link></li>
              <li><Link href="/#contact" className="text-gray-400 hover:text-gold-500 transition-colors">Contact</Link></li>
            </ul>
          </div>
          
          {/* Services Links */}
          <div>
            <h5 className="font-semibold text-gold-500 mb-4">Services</h5>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="text-gray-400 hover:text-gold-500 transition-colors">Acquisitions</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-gold-500 transition-colors">Development</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-gold-500 transition-colors">Asset Management</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-gold-500 transition-colors">Investment Advisory</Link></li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">© 2025 Idlewood Capital. All rights reserved.</p>
          <div className="flex gap-6 text-sm">
            <Link href="#" className="text-gray-400 hover:text-gold-500 transition-colors">Privacy Policy</Link>
            <Link href="#" className="text-gray-400 hover:text-gold-500 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}