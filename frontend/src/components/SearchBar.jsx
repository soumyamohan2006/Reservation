import React from 'react'
import { Search, Calendar } from 'lucide-react'

const SearchBar = () => {
  return (
    <div className="w-full max-w-5xl glass-panel rim-light p-2 rounded-3xl md:rounded-full soft-glow">
      <div className="flex flex-col md:flex-row items-center gap-2 md:gap-0">
        <div className="flex-1 flex items-center px-6 py-3 border-b md:border-b-0 md:border-r border-white/5 w-full">
          <Search size={20} className="text-primary mr-3" />
          <input 
            className="bg-transparent border-none focus:ring-0 text-white placeholder:text-slate-500 w-full text-sm font-body outline-none" 
            placeholder="Search halls or spaces by name..." 
            type="text"
          />
        </div>
        
        <div className="flex-none flex items-center px-6 py-3 border-b md:border-b-0 md:border-r border-white/5 w-full md:w-auto overflow-hidden">
          <Calendar size={18} className="text-primary/60 mr-2" />
          <input 
            className="bg-transparent border-none focus:ring-0 text-white text-sm cursor-pointer outline-none" 
            style={{ colorScheme: 'dark' }} // Native dark mode date picker
            type="date"
          />
        </div>
        
        <div className="flex-none px-6 py-3 border-b md:border-b-0 md:border-r border-white/5 w-full md:w-auto">
          <select className="bg-transparent border-none focus:ring-0 text-white text-sm cursor-pointer appearance-none outline-none w-full">
            <option className="bg-surface text-white">Capacity: Any</option>
            <option className="bg-surface text-white">1-10 Guests</option>
            <option className="bg-surface text-white">10-50 Guests</option>
            <option className="bg-surface text-white">50+ Guests</option>
          </select>
        </div>
        
        <div className="flex-none px-6 py-3 w-full md:w-auto mr-2">
          <select className="bg-transparent border-none focus:ring-0 text-white text-sm cursor-pointer appearance-none outline-none w-full">
            <option className="bg-surface text-white">Type: All</option>
            <option className="bg-surface text-white">Hall</option>
            <option className="bg-surface text-white">Meeting Room</option>
          </select>
        </div>
        
        <button className="bg-primary text-on-primary-fixed w-full md:w-auto px-8 py-3 rounded-full font-bold text-sm transition-all hover:shadow-[0_0_20px_rgba(173,198,255,0.4)] hover:brightness-110 active:scale-95 duration-300">
          Search
        </button>
      </div>
    </div>
  )
}

export default SearchBar
