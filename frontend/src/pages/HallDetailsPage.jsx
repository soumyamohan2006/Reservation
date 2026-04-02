import React from 'react'
import { Link, useParams } from 'react-router-dom'
import { MapPin, Users, CheckCircle, Video, Wifi, MonitorSpeaker, Calendar } from 'lucide-react'

function HallDetailsPage({ halls }) {
  const { hallId } = useParams()
  // Matches Mongo ID or fallback id
  const hall = halls.find((item) => item.id === hallId || item._id === hallId)

  // Use placeholder image if none exists
  const defaultImage = "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2669&ixlib=rb-4.0.3"

  if (!hall) {
    return (
      <main className="min-h-[70vh] flex flex-col items-center justify-center">
        <div className="glass-panel rim-light p-12 text-center rounded-2xl max-w-md w-full">
          <h1 className="font-headline text-3xl text-white mb-4">Space Not Found</h1>
          <p className="text-slate-400 font-light mb-8">The sophisticated space you are looking for is currently unavailable or doesn't exist.</p>
          <Link to="/" className="bg-primary text-on-primary-fixed px-8 py-3 rounded-full font-bold text-sm transition-all hover:shadow-[0_0_20px_rgba(173,198,255,0.4)] block">
            Return to Directory
          </Link>
        </div>
      </main>
    )
  }

  // Pre-map icons to string features
  const getIcon = (feature) => {
    const f = feature.toLowerCase()
    if (f.includes('projector') || f.includes('video')) return <Video size={20} className="text-primary group-hover:scale-110 transition-transform" />
    if (f.includes('wifi') || f.includes('internet')) return <Wifi size={20} className="text-primary group-hover:scale-110 transition-transform" />
    if (f.includes('sound') || f.includes('audio')) return <MonitorSpeaker size={20} className="text-primary group-hover:scale-110 transition-transform" />
    return <CheckCircle size={20} className="text-primary group-hover:scale-110 transition-transform" />
  }

  return (
    <div className="flex flex-col w-full pb-32">
      {/* Immersive Hero Header */}
      <section className="relative h-[60vh] min-h-[500px] w-full mt-[-80px]">
        {/* The negative margin pulls it up underneath the transparent fixed navbar */}
        <div className="absolute inset-0 z-0">
          <img src={hall.imageUrl || hall.image || defaultImage} alt={hall.name} className="w-full h-full object-cover" />
          {/* Gradient Overlay for Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent"></div>
        </div>
        
        <div className="relative z-10 w-full h-full max-w-7xl mx-auto px-8 flex flex-col justify-end pb-12">
          <span className="bg-surface/60 backdrop-blur-md px-4 py-1.5 rounded-lg text-xs uppercase tracking-widest text-primary font-bold border border-white/10 w-fit mb-6">
            {hall.capacity >= 150 ? 'Premium Facility' : 'Executive Suite'}
          </span>
          <h1 className="font-headline text-5xl md:text-7xl text-white mb-4 tracking-tight drop-shadow-2xl">{hall.name}</h1>
          <p className="text-xl md:text-2xl font-light text-slate-300 max-w-3xl drop-shadow-lg">{hall.description || "A masterfully designed environment calibrated for high-impact gatherings and corporate excellence."}</p>
        </div>
      </section>

      {/* Main Content Layout */}
      <section className="w-full max-w-7xl mx-auto px-8 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-16">
        
        {/* Left Column: Details & Amenities */}
        <div className="lg:col-span-2 space-y-16">
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex flex-col gap-2">
              <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center text-primary border border-white/5">
                <Users size={24} strokeWidth={1.5} />
              </div>
              <p className="text-xs font-label uppercase tracking-widest text-secondary mt-2">Capacity</p>
              <p className="text-on-surface font-semibold text-lg">{hall.capacity} Guests</p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center text-primary border border-white/5">
                <MapPin size={24} strokeWidth={1.5} />
              </div>
              <p className="text-xs font-label uppercase tracking-widest text-secondary mt-2">Location</p>
              <p className="text-on-surface font-semibold text-lg">Central Campus</p>
            </div>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-white/10 via-white/5 to-transparent"></div>

          {/* Amenities Grid */}
          <div className="space-y-8">
            <h2 className="text-3xl font-soria text-white">Curated Amenities</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-12">
              {hall.features && hall.features.length > 0 ? (
                hall.features.map(f => (
                  <div key={f} className="flex items-center gap-4 group bg-surface-container-lowest/50 p-4 rounded-xl border border-white/5 hover:bg-surface-container-low transition-colors">
                    {getIcon(f)}
                    <span className="text-slate-300 font-medium">{f}</span>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 italic">No specific amenities documented.</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-3xl font-soria text-white">About the Architecture</h2>
            <p className="text-slate-400 font-light leading-relaxed text-lg">
              Defined by sweeping geometric lines and floor-to-ceiling soundproof glass, {hall.name} is engineered to foster focus and collaboration. 
              The intelligent acoustic layout ensures crystal clear sound propagation, while the customizable 
              lighting arrays allow you to shift the mood instantly from a bright, energetic workshop environment 
              to an intimate, warm evening aesthetic.
            </p>
          </div>
        </div>

        {/* Right Column: Reservation Sticky Card */}
        <div className="relative">
          <div className="sticky top-32 glass-panel rim-light rounded-[2rem] p-8 soft-glow flex flex-col gap-8 border border-white/10">
            <div>
              <p className="text-sm font-label uppercase tracking-widest text-secondary mb-2">Investment</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-headline text-white">${hall.pricePerHour || hall.price || 0}</span>
                <span className="text-slate-400">/ hour</span>
              </div>
            </div>

            <div className="h-px bg-white/5 w-full"></div>

            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Availability</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Accepting Bookings
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Minimum Duration</span>
                <span className="text-white font-medium">1 Hour</span>
              </div>
            </div>

            <div className="pt-4">
              <Link 
                to={`/reserve/${hall._id || hall.id}`} 
                className="w-full bg-primary text-on-primary-fixed py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_25px_rgba(173,198,255,0.5)] hover:bg-white"
              >
                <Calendar size={18} />
                Secure Your Date
              </Link>
              <p className="text-center text-xs text-slate-500 mt-4">You won't be charged until the custodian approves your request.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HallDetailsPage
