'use client'

import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

/**
 * 🎨 Modal - Lightweight fallback component for missing Dialog library.
 * Uses React Portal for cleaner DOM structure and backdrop.
 */
export function Modal({ isOpen, onClose, children, className }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Handle click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current === e.target) onClose()
  }

  if (!isOpen) return null

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
      ref={modalRef}
    >
      <div 
        className={cn(
          "bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative animate-in zoom-in-95 slide-in-from-bottom-4 duration-300",
          className
        )}
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>
        {children}
      </div>
    </div>,
    document.body
  )
}
