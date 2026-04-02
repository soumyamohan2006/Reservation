import React from 'react'
import HallCard from '../components/HallCard'
import SearchBar from '../components/SearchBar'
import { Router, ConciergeBell, Utensils, MonitorPlay, Quote } from 'lucide-react'

function HomePage({ halls, user, role }) {
  return (
    <div className="flex flex-col w-full flex-grow">
      {/* Hero & Search Area */}
      <section className="relative min-h-[614px] flex flex-col items-center justify-center px-6 py-20 overflow-hidden">
        <div className="max-w-4xl w-full text-center mb-12 relative z-10">
          <h1 className="font-headline text-5xl md:text-7xl text-white mb-6 tracking-tight">Discover Your Next Masterpiece.</h1>
          <p className="text-on-surface-variant text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
            Explore our curated collection of executive spaces and halls for your next event or meeting.
          </p>
        </div>
        
        <div className="relative z-10 w-full flex justify-center">
          <SearchBar />
        </div>
      </section>

      {/* Listings Area */}
      <section className="max-w-7xl mx-auto px-8 pb-32 w-full" id="spaces">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="font-soria text-4xl text-white">Curated Spaces</h2>
            <p className="text-on-surface-variant text-sm mt-1">Available for immediate reservation</p>
          </div>
          <div className="hidden md:flex gap-2">
            <span className="px-4 py-1.5 rounded-full bg-surface-container-highest text-primary text-xs font-bold tracking-widest uppercase border border-primary/20">All Spaces</span>
            <span className="px-4 py-1.5 rounded-full bg-surface-container-low text-slate-500 text-xs font-bold tracking-widest uppercase hover:text-slate-300 cursor-pointer transition-colors">Exclusive</span>
          </div>
        </div>
        
        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {halls.map((hall) => (
            <HallCard key={hall._id || hall.id} hall={hall} />
          ))}
        </div>
      </section>

      {/* Featured Amenities Section */}
      <section className="py-24 relative overflow-hidden bg-surface-container-lowest/30 border-y border-white/5" id="amenities">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="font-soria text-4xl text-white mb-4">Exceptional Amenities</h2>
            <p className="text-on-surface-variant max-w-xl mx-auto font-light">Every space is equipped with industry-leading standards to ensure your productivity and comfort.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Router, title: "High-Speed Fiber", text: "Redundant gigabit connections to keep you flawlessly synced with the world." },
              { icon: ConciergeBell, title: "Concierge Service", text: "Dedicated on-site support to manage logistics and cater to every request." },
              { icon: Utensils, title: "Catering Options", text: "Curated gourmet menus and refreshments available for any size group." },
              { icon: MonitorPlay, title: "AV Equipment", text: "State-of-the-art 4K displays and surround sound for impactful presentations." }
            ].map((amenity, idx) => (
              <div key={idx} className="glass-panel rim-light p-10 rounded-2xl flex flex-col items-center text-center transition-transform hover:-translate-y-2 duration-300">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <amenity.icon size={32} className="text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="font-headline text-xl text-white mb-3">{amenity.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{amenity.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24" id="process">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-20">
            <h2 className="font-soria text-4xl text-white mb-4">The Seamless Experience</h2>
            <p className="text-on-surface-variant max-w-xl mx-auto">From discovery to arrival, your journey is designed for ease.</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-start justify-between gap-12">
            {[
              { step: "01", title: "Search", text: "Browse our collection of architectural masterpieces and filter by your specific capacity and style requirements." },
              { step: "02", title: "Book", text: "Secure your preferred slot instantly with our streamlined digital reservation system and receive immediate confirmation." },
              { step: "03", title: "Arrive", text: "Your space will be perfectly prepared. Our concierge greets you upon arrival to ensure a smooth transition into your event." }
            ].map((item, idx) => (
              <div key={idx} className="flex-1 relative">
                <span className="absolute -top-10 left-0 text-[120px] font-headline font-bold text-white/5 select-none leading-none">{item.step}</span>
                <div className="relative pt-4">
                  <h3 className="font-headline text-3xl text-white mb-4">{item.title}</h3>
                  <p className="text-slate-400 leading-relaxed font-light">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-32 relative" id="testimonials">
        <div className="max-w-4xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="font-soria text-4xl text-white">Executive Feedback</h2>
          </div>
          <div className="glass-panel rim-light p-16 rounded-[2rem] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Quote size={100} className="text-primary rotate-180" strokeWidth={1} />
            </div>
            <blockquote className="relative z-10">
              <p className="font-headline text-3xl italic text-white mb-10 leading-snug">
                "Obsidian Spaces has completely redefined our expectations for off-site meetings. The architectural depth and the seamless booking process are unparalleled in the industry."
              </p>
              <footer className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-700 overflow-hidden">
                  <img alt="Julian Vane" className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=400&ixlib=rb-4.0.3" />
                </div>
                <div>
                  <p className="font-bold text-white tracking-wide">Julian Vane</p>
                  <p className="text-xs text-primary uppercase tracking-widest font-medium">Chief Strategy Officer, Aurelius Corp</p>
                </div>
              </footer>
            </blockquote>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage

