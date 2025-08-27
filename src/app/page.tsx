import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import ContactForm from '@/components/ContactForm'
import Image from 'next/image'
import Link from 'next/link'

export default function Home() {
  return (
    <>
      <Navigation />

      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat" style={{backgroundImage: "url('/assets/images/hero/hero-background.jpg')"}}>
        {/* Background overlay */}
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20"></div>
        
        {/* Content */}
        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <h1 className="animate-fade-up">
            <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold text-white mb-4">
              Compounding Wealth Through
            </span>
            <span className="block text-3xl sm:text-4xl md:text-5xl font-display text-gold-500">
              Strategic Retail Investments
            </span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-200 max-w-3xl mx-auto animate-fade-up">
            Idlewood Capital acquires and repositions retail properties across high-growth Southeast markets, 
            transforming underperforming centers through strategic improvements, disciplined asset management, 
            and long-term value creation.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center animate-fade-up">
            <Link href="#portfolio" className="px-8 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200">
              View Portfolio
            </Link>
            <Link href="#about" className="px-8 py-3 bg-transparent text-white font-semibold rounded-lg border-2 border-white/50 hover:bg-white/10 hover:border-white transition-all duration-200">
              Our Approach
            </Link>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center text-white/70 animate-bounce">
          <div className="flex flex-col items-center">
            <span className="text-sm mb-2">Scroll to explore</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
            </svg>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="text-gold-500 font-semibold uppercase tracking-wider text-sm">Our Strategy</span>
            <h2 className="mt-2 text-4xl md:text-5xl font-display font-bold text-gray-900">Disciplined Retail Investment</h2>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center p-6 bg-gray-50 rounded-xl">
              <h3 className="text-4xl font-bold text-gold-500 mb-2">18+</h3>
              <p className="text-gray-600">Years of Experience</p>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-xl">
              <h3 className="text-4xl font-bold text-gold-500 mb-2">Proven</h3>
              <p className="text-gray-600">Track Record</p>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-xl">
              <h3 className="text-4xl font-bold text-gold-500 mb-2">Southeast</h3>
              <p className="text-gray-600">Regional Focus</p>
            </div>
          </div>
          
          {/* Description */}
          <div className="max-w-4xl mx-auto text-center mb-16">
            <p className="text-lg text-gray-600 leading-relaxed">
              We acquire and reposition retail centers across Southeast markets, reducing risk through 
              targeted improvements and hands-on management, turning underperforming properties into 
              durable, income-producing assets.
            </p>
          </div>
          
          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-gold-500 to-gold-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">Lifecycle Acquisition Strategy</h4>
              <p className="text-gray-600">
                We target retail properties across all stages, from development and lease-up to stabilized assets, 
                with a focus on repositioning for long-term performance.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-gold-500 to-gold-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">De-Risked Value Growth</h4>
              <p className="text-gray-600">
                We reduce risk and enhance returns through tenant mix optimization, 
                physical upgrades, and disciplined operations.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-gold-500 to-gold-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">Long-Term Value Creation</h4>
              <p className="text-gray-600">
                We balance patient ownership with flexible liquidity options, compounding wealth as assets mature.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section id="portfolio" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="text-gold-500 font-semibold uppercase tracking-wider text-sm">Our Properties</span>
            <h2 className="mt-2 text-4xl md:text-5xl font-display font-bold text-gray-900">Portfolio Across the Lifecycle</h2>
          </div>
          
          {/* Portfolio Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Derita Plaza */}
            <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300">
              <div className="h-64 bg-cover bg-center relative group" style={{backgroundImage: "url('/assets/images/portfolio/derita-plaza.jpg')"}}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                  <div className="p-6 text-white">
                    <h4 className="text-xl font-semibold">Derita Plaza</h4>
                    <span className="inline-block mt-2 px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs">Active</span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h4 className="text-xl font-semibold mb-2">Derita Plaza</h4>
                <p className="text-gray-600 text-sm mb-4">High-potential retail center in an emerging Charlotte submarket, positioned for value creation through redevelopment and tenant optimization.</p>
                <div className="flex gap-2">
                  <span className="text-xs px-3 py-1 bg-gold-500/10 text-gold-600 rounded-full">Value-Add Retail</span>
                  <span className="text-xs px-3 py-1 bg-gold-500/10 text-gold-600 rounded-full">Charlotte, NC</span>
                </div>
              </div>
            </div>
            
            {/* 2710 Gervais */}
            <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300">
              <div className="h-64 bg-cover bg-center relative group" style={{backgroundImage: "url('/assets/images/portfolio/2710-gervais.jpg')"}}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                  <div className="p-6 text-white">
                    <h4 className="text-xl font-semibold">2710 Gervais</h4>
                    <span className="inline-block mt-2 px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs">Active</span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h4 className="text-xl font-semibold mb-2">2710 Gervais</h4>
                <p className="text-gray-600 text-sm mb-4">Comprehensive retail redevelopment in Columbia&apos;s growing corridor, repositioned for stronger cash flow and tenant performance.</p>
                <div className="flex gap-2">
                  <span className="text-xs px-3 py-1 bg-gold-500/10 text-gold-600 rounded-full">Redevelopment</span>
                  <span className="text-xs px-3 py-1 bg-gold-500/10 text-gold-600 rounded-full">Columbia, SC</span>
                </div>
              </div>
            </div>
            
            {/* Monroe Road */}
            <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300">
              <div className="h-64 bg-cover bg-center relative group" style={{backgroundImage: "url('/assets/images/portfolio/monroe-road.jpg')"}}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                  <div className="p-6 text-white">
                    <h4 className="text-xl font-semibold">Monroe Road</h4>
                    <span className="inline-block mt-2 px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs">Active</span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h4 className="text-xl font-semibold mb-2">Monroe Road</h4>
                <p className="text-gray-600 text-sm mb-4">Comprehensive two-phase redevelopment of a retail center in Charlotte&apos;s Oakhurst submarket, designed to enhance tenant mix, strengthen cash flow, and create long-term value.</p>
                <div className="flex gap-2">
                  <span className="text-xs px-3 py-1 bg-gold-500/10 text-gold-600 rounded-full">Redevelopment</span>
                  <span className="text-xs px-3 py-1 bg-gold-500/10 text-gold-600 rounded-full">Charlotte, NC</span>
                </div>
              </div>
            </div>
            
            {/* NoDa Tryon Land */}
            <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300">
              <div className="h-64 bg-cover bg-center relative group" style={{backgroundImage: "url('/assets/images/portfolio/noda-tryon-land.jpg')"}}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                  <div className="p-6 text-white">
                    <h4 className="text-xl font-semibold">NoDa Tryon Land</h4>
                    <span className="inline-block mt-2 px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs">Active</span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h4 className="text-xl font-semibold mb-2">NoDa Tryon Land</h4>
                <p className="text-gray-600 text-sm mb-4">Covered land assemblage in Charlotte&apos;s NoDa arts district, offering future development potential along the Lynx Blue Line.</p>
                <div className="flex gap-2">
                  <span className="text-xs px-3 py-1 bg-gold-500/10 text-gold-600 rounded-full">Land Assemblage</span>
                  <span className="text-xs px-3 py-1 bg-gold-500/10 text-gold-600 rounded-full">Charlotte, NC</span>
                </div>
              </div>
            </div>
            
            {/* City Green */}
            <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300">
              <div className="h-64 bg-cover bg-center relative group" style={{backgroundImage: "url('/assets/images/portfolio/city-green.jpg')"}}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                  <div className="p-6 text-white">
                    <h4 className="text-xl font-semibold">City Green</h4>
                    <span className="inline-block mt-2 px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs">Active</span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h4 className="text-xl font-semibold mb-2">City Green</h4>
                <p className="text-gray-600 text-sm mb-4">Premium Uptown Charlotte retail space, strategically located near Spectrum Center and designed for long-term tenant demand.</p>
                <div className="flex gap-2">
                  <span className="text-xs px-3 py-1 bg-gold-500/10 text-gold-600 rounded-full">Retail Space</span>
                  <span className="text-xs px-3 py-1 bg-gold-500/10 text-gold-600 rounded-full">Charlotte, NC</span>
                </div>
              </div>
            </div>
            
            {/* 2422 Sugar Creek */}
            <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300">
              <div className="h-64 bg-cover bg-center relative group" style={{backgroundImage: "url('/assets/images/portfolio/2422-sugar-creek.jpg')"}}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                  <div className="p-6 text-white">
                    <h4 className="text-xl font-semibold">2422 Sugar Creek</h4>
                    <span className="inline-block mt-2 px-3 py-1 bg-green-500/20 backdrop-blur rounded-full text-xs">Completed</span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h4 className="text-xl font-semibold mb-2">2422 Sugar Creek</h4>
                <p className="text-gray-600 text-sm mb-4">Successfully repositioned and exited commercial property in Charlotte&apos;s Derita submarket, demonstrating our value-creation strategy in action.</p>
                <div className="flex gap-2">
                  <span className="text-xs px-3 py-1 bg-green-500/10 text-green-600 rounded-full">Successful Exit</span>
                  <span className="text-xs px-3 py-1 bg-gold-500/10 text-gold-600 rounded-full">Charlotte, NC</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="text-gold-500 font-semibold uppercase tracking-wider text-sm">Leadership</span>
            <h2 className="mt-2 text-4xl md:text-5xl font-display font-bold text-gray-900">Expert Team</h2>
          </div>
          
          {/* Team Member */}
          <div className="max-w-md mx-auto">
            <div className="text-center">
              <div className="relative inline-block mb-6">
                <Image
                  src="/assets/images/team/george-headshot.jpg"
                  alt="George R. Kornegay IV"
                  width={256}
                  height={256}
                  className="w-64 h-64 rounded-full object-cover shadow-xl"
                />
                <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-8">
                  <a
                    href="https://www.linkedin.com/in/georgekornegay/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/90 backdrop-blur p-3 rounded-full hover:bg-white transition-colors"
                  >
                    <svg className="w-5 h-5 text-[#0077b5]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                  </a>
                </div>
              </div>
              <h4 className="text-2xl font-semibold mb-1">George R. Kornegay IV</h4>
              <p className="text-gold-500 font-medium mb-4">Founder & Managing Partner</p>
              <p className="text-gray-600 max-w-sm mx-auto mb-6">
                George Kornegay leads Idlewood Capital with extensive experience acquiring, repositioning, 
                and managing retail properties across the Southeast, with a focus on disciplined execution 
                and investor alignment.
              </p>
              <a
                href="https://www.linkedin.com/in/georgekornegay/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 border-2 border-[#0077b5] text-[#0077b5] rounded-lg hover:bg-[#0077b5] hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
                Connect on LinkedIn
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="text-gold-500 font-semibold uppercase tracking-wider text-sm">Get In Touch</span>
            <h2 className="mt-2 text-4xl md:text-5xl font-display font-bold text-white">Contact</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div>
              <p className="text-gray-300 text-lg mb-8">
                For inquiries regarding our retail property investments and strategic approach, 
                we welcome communication from qualified parties and industry professionals.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gold-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h5 className="text-white font-semibold">Office</h5>
                    <p className="text-gray-400">1515 Mockingbird Ln., Suite 7123<br />Charlotte, NC 28209</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gold-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h5 className="text-white font-semibold">Email</h5>
                    <p className="text-gray-400">info@idlewoodcapital.com</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Contact Form */}
            <ContactForm />
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}