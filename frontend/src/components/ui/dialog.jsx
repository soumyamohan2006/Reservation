import React from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from './button'

function Dialog({ open, onOpenChange, children }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-white/10 bg-[#111114] shadow-2xl shadow-black/60">
        {children}
      </div>
    </div>
  )
}

function DialogContent({ className, children }) {
  return <div className={cn('p-6', className)}>{children}</div>
}

function DialogHeader({ className, children }) {
  return <div className={cn('mb-4 space-y-1', className)}>{children}</div>
}

function DialogTitle({ className, children }) {
  return <h2 className={cn('text-xl font-semibold text-white', className)}>{children}</h2>
}

function DialogDescription({ className, children }) {
  return <p className={cn('text-sm text-slate-400', className)}>{children}</p>
}

function DialogFooter({ className, children }) {
  return <div className={cn('mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end', className)}>{children}</div>
}

function DialogCloseButton({ onClick }) {
  return (
    <Button variant="ghost" size="icon" className="absolute right-3 top-3 text-slate-400" onClick={onClick}>
      <X size={16} />
    </Button>
  )
}

export { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogCloseButton }
