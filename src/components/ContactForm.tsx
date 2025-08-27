'use client'

import { useState } from 'react'

interface FormData {
  name: string
  email: string
  phone: string
  inquiryType: string
  message: string
}

export default function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    inquiryType: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSubmitStatus('success')
        setFormData({
          name: '',
          email: '',
          phone: '',
          inquiryType: '',
          message: ''
        })
      } else {
        throw new Error(result.error || 'Failed to send message')
      }
    } catch (error) {
      console.error('Form submission error:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
      // Reset status after 3 seconds
      setTimeout(() => setSubmitStatus('idle'), 3000)
    }
  }

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-xl p-8 border border-white/10">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <input
            type="text"
            name="name"
            id="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20"
          />
        </div>
        <div>
          <input
            type="email"
            name="email"
            id="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20"
          />
        </div>
        <div>
          <input
            type="tel"
            name="phone"
            id="phone"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20"
          />
        </div>
        <div>
          <select
            name="inquiryType"
            id="inquiryType"
            value={formData.inquiryType}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20"
          >
            <option value="" className="bg-gray-800">Subject</option>
            <option value="investor" className="bg-gray-800">Investor Inquiry</option>
            <option value="acquisition" className="bg-gray-800">Property Acquisition Opportunity</option>
            <option value="tenant" className="bg-gray-800">Tenant / Leasing Inquiry</option>
            <option value="partnership" className="bg-gray-800">Partnership Discussion</option>
            <option value="professional" className="bg-gray-800">Professional Services</option>
            <option value="general" className="bg-gray-800">General Inquiry</option>
          </select>
        </div>
        <div>
          <textarea
            name="message"
            id="message"
            placeholder="Message"
            rows={4}
            value={formData.message}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 resize-none"
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full px-6 py-3 font-semibold rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
            submitStatus === 'success'
              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
              : submitStatus === 'error'
              ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
              : 'bg-gradient-to-r from-gold-500 to-gold-600 text-white hover:shadow-xl transform hover:-translate-y-1'
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="inline-block w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Sending...
            </span>
          ) : submitStatus === 'success' ? (
            'Message Sent!'
          ) : submitStatus === 'error' ? (
            'Error - Please Try Again'
          ) : (
            'Send Message'
          )}
        </button>
      </form>
    </div>
  )
}