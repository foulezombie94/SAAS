'use client'

import React, { useRef, useState, useEffect } from 'react'
import { Button } from './Button'
import { RotateCcw, PenTool } from 'lucide-react'

interface SignaturePadProps {
  onSave: (dataUrl: string) => void
  label?: string
}

export const SignaturePad = ({ onSave, label }: SignaturePadProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isEmpty, setIsEmpty] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.strokeStyle = '#00236f' // Primary color
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true)
    draw(e)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    const canvas = canvasRef.current
    if (canvas) {
      onSave(canvas.toDataURL())
    }
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const rect = canvas.getBoundingClientRect()
    let x, y

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
    } else {
      x = (e as React.MouseEvent).clientX - rect.left
      y = (e as React.MouseEvent).clientY - rect.top
    }

    ctx.lineTo(x, y)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsEmpty(false)
  }

  const clear = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.beginPath()
    setIsEmpty(true)
  }

  return (
    <div className="flex flex-col gap-4">
      {label && <label className="text-[0.6875rem] font-bold uppercase tracking-[0.05em] text-on-surface-variant">{label}</label>}
      <div className="relative border-2 border-dashed border-outline-variant/30 rounded-md bg-surface-container-low overflow-hidden touch-none">
        <canvas
          ref={canvasRef}
          width={600}
          height={300}
          className="w-full h-[200px] cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseMove={draw}
          onTouchStart={startDrawing}
          onTouchEnd={stopDrawing}
          onTouchMove={draw}
        />
        {isEmpty && (
           <div className="absolute inset-0 flex flex-col items-center justify-center text-on-surface-variant/30 pointer-events-none">
              <PenTool size={40} className="mb-2" />
              <span className="font-bold text-sm">Signez ici pour acceptation</span>
           </div>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={clear}
          className="absolute bottom-2 right-2 text-on-surface-variant/40"
        >
          <RotateCcw size={20} />
        </Button>
      </div>
    </div>
  )
}
