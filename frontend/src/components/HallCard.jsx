import React from 'react'
import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'

const defaultImage = "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2669&ixlib=rb-4.0.3"

// Skeleton shimmer for when backend is waking up
function HallCardSkeleton() {
  return (
    <div className="flex flex-col bg-surface-container-low rounded-2xl overflow-hidden border border-white/5 animate-pulse">
      <div className="h-72 bg-white/5" />
      <div className="p-8 flex flex-col gap-4">
        <div className="h-6 bg-white/5 rounded-lg w-3/4" />
        <div className="h-4 bg-white/5 rounded-lg w-1/2" />
        <div className="mt-auto flex justify-between pt-4">
          <div className="h-8 bg-white/5 rounded-lg w-1/3" />
          <div className="h-9 bg-white/5 rounded-xl w-1/3" />
        </div>
      </div>
    </div>
  )
}

const HallCard = ({ hall, isPlaceholder = false }) => {
  if (isPlaceholder) return <HallCardSkeleton />

  const href = hall._id && !hall._id.startsWith('mock-') ? `/halls/${hall._id}` : '#'

  return (
    <Link
      to={href}
      className="group flex flex-col bg-surface-container-low hover:bg-surface-container-high transition-all duration-500 rounded-2xl overflow-hidden cursor-pointer shadow-xl border border-white/5 hover:border-white/10"
    >
      <div className="relative h-72 overflow-hidden">
        <img
          src={hall.imageUrl || hall.image || defaultImage}
          alt={hall.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute top-4 right-4 bg-surface/60 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] uppercase tracking-widest text-primary font-bold border border-white/10">
          {hall.capacity >= 150 ? 'Premium Hall' : 'Executive'}
        </div>
      </div>

      <div className="p-8 flex flex-col flex-grow">
        <h3 className="font-headline text-2xl text-white mb-2 line-clamp-1">{hall.name}</h3>
        <p className="text-slate-400 text-sm mb-6 flex items-center">
          <Users size={16} className="mr-2 opacity-70" />
          Up to {hall.capacity} guests
        </p>

        <div className="mt-auto flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-tighter block">Capacity</span>
            <span className="text-xl font-medium text-white">
              {hall.capacity} <span className="text-sm text-slate-400">seats</span>
            </span>
          </div>
          <button className="bg-surface-container-highest text-primary px-5 py-2.5 rounded-xl text-sm font-semibold group-hover:bg-primary group-hover:text-on-primary transition-all duration-300">
            View Details
          </button>
        </div>
      </div>
    </Link>
  )
}

export default HallCard
