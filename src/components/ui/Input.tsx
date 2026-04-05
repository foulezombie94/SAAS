import React from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, icon, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2 w-full">
        {label && (
          <label className="text-[0.6875rem] font-bold uppercase tracking-[0.05em] text-on-surface-variant">
            {label}
          </label>
        )}
        <div className="relative flex items-center group">
          {icon && (
            <div className="absolute left-3 pointer-events-none transition-colors group-focus-within:text-primary">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              'input-field',
              icon && 'pl-10',
              error && 'border-error ring-1 ring-error',
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && <span className="text-sm text-error">{error}</span>}
      </div>
    )
  }
)

Input.displayName = 'Input'
