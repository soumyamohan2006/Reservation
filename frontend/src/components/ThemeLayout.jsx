import React from 'react'
import Navbar from './Navbar'
import Footer from './Footer'

const ThemeLayout = ({ children }) => {
  return (
    <div className="relative min-h-screen flex flex-col pt-20">
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-[0] overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-glow-indigo blur-[120px]"></div>
        <div className="absolute top-[30%] -right-[10%] w-[50%] h-[50%] bg-glow-slate blur-[100px]"></div>
        <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] bg-glow-indigo/50 blur-[120px]"></div>
      </div>
      
      <Navbar />
      
      {/* Page Content */}
      <main className="relative z-10 flex-grow flex flex-col">
        {children}
      </main>
      
      <Footer />
    </div>
  )
}

export default ThemeLayout
