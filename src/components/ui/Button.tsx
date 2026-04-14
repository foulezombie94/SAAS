import React from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'tertiary' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  isLoading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    const variants = {
      primary: 'bg-primary text-on-primary hover:bg-primary/95 hover:shadow-md active:bg-primary',
      tertiary: 'bg-tertiary-fixed-dim text-on-tertiary-fixed hover:bg-tertiary-fixed hover:shadow-md active:bg-tertiary-fixed-dim',
      ghost: 'bg-transparent hover:bg-surface-container-low text-primary',
      outline: 'bg-white border border-slate-200 text-primary hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100'
    }

    return (
      <button
        ref={ref}
        className={cn(
          'btn',
          variants[variant],
          size === 'sm' && 'px-4 py-2 min-h-[36px] text-[10px]',
          size === 'lg' && 'px-10 py-5 min-h-[64px] text-[13px]',
          size === 'icon' && 'p-2 min-h-[44px] w-[44px]',
          className
        )}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Chargement...
          </span>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
