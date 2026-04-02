import React from 'react'
import { cn } from '../../lib/utils'

const variants = {
  default: 'bg-primary text-on-primary-fixed hover:brightness-110 shadow-[0_0_20px_rgba(173,198,255,0.15)]',
  secondary: 'bg-white/5 text-white border border-white/10 hover:bg-white/10',
  outline: 'bg-transparent border border-white/10 text-slate-300 hover:text-white hover:bg-white/5',
  destructive: 'bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/20',
  ghost: 'bg-transparent text-slate-300 hover:text-white hover:bg-white/5',
}

const sizes = {
  default: 'h-11 px-5 py-2.5',
  sm: 'h-9 px-4 py-2',
  lg: 'h-12 px-6 py-3',
  icon: 'h-10 w-10 p-0',
}

const Button = React.forwardRef(({ className, variant = 'default', size = 'default', asChild = false, type = 'button', ...props }, ref) => {
  const Comp = asChild ? 'span' : 'button'

  return (
    <Comp
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      type={Comp === 'button' ? type : undefined}
      {...props}
    />
  )
})

Button.displayName = 'Button'

export { Button }
