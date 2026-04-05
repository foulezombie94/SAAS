import React from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2 w-full">
        {label && (
          <label className="text-[0.6875rem] font-bold uppercase tracking-[0.05em] text-on-surface-variant">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            'input-field',
            error && 'border-error ring-1 ring-error',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <span className="text-sm text-error">{error}</span>}
      </div>
    )
  }
)

Input.displayName = 'Input'
