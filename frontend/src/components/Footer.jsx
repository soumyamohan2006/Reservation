import React from 'react'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="w-full py-12 bg-surface border-t border-white/5 relative z-10 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center px-8">
        <div className="mb-6 md:mb-0">
          <p className="font-body text-[10px] uppercase tracking-[0.15em] text-slate-500">
            © {new Date().getFullYear()} Obsidian Executive Spaces. All Rights Reserved.
          </p>
        </div>
        <div className="flex gap-8">
          <Link to="#" className="font-body text-[10px] uppercase tracking-[0.15em] text-slate-500 hover:text-blue-300 transition-colors opacity-80 hover:opacity-100">
            Privacy Policy
          </Link>
          <Link to="#" className="font-body text-[10px] uppercase tracking-[0.15em] text-slate-500 hover:text-blue-300 transition-colors opacity-80 hover:opacity-100">
            Terms of Service
          </Link>
          <Link to="#" className="font-body text-[10px] uppercase tracking-[0.15em] text-slate-500 hover:text-blue-300 transition-colors opacity-80 hover:opacity-100">
            Contact Concierge
          </Link>
        </div>
      </div>
    </footer>
  )
}

export default Footer
