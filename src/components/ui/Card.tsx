import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'flat' | 'glass'
}

export const Card = ({ children, className, variant = 'elevated', ...props }: CardProps) => {
  const variants = {
    elevated: 'surface-card',
    flat: 'bg-surface-container-low p-6 rounded-md shadow-none',
    glass: 'glass p-6 rounded-md shadow-lg border border-white/20'
  }

  return (
    <div 
      className={`relative flex flex-col w-full transition-all duration-300 ${variants[variant]} ${className}`} 
      {...props}
    >
      {children}
    </div>
  )
}
