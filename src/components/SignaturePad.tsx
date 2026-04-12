'use client'

import React, { useRef, useState, useEffect } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Button } from './ui/Button'
import { Eraser, Check, X } from 'lucide-react'

interface SignaturePadProps {
  onSave: (signatureDataUrl: string) => void
  onCancel: () => void
  isLoading?: boolean
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onCancel, isLoading }) => {
  const sigCanvas = useRef<SignatureCanvas>(null)
  const [isEmpty, setIsEmpty] = useState(true)

  // 📐 Resizing canvas for high-DPI (Retina/Mobile) without clearing the drawing
  useEffect(() => {
    const canvas = sigCanvas.current?.getCanvas()
    if (!canvas) return

    const resizeCanvas = () => {
      // 🛡️ SECURITY : Save existing data before resizing (resizing natively clears canvas)
      const data = sigCanvas.current?.toData()
      
      const ratio = Math.max(window.devicePixelRatio || 1, 1)
      canvas.width = canvas.offsetWidth * ratio
      canvas.height = canvas.offsetHeight * ratio
      canvas.getContext('2d')?.scale(ratio, ratio)
      
      // 🔄 RESTORE drawing after resize
      if (data && data.length > 0) {
        sigCanvas.current?.fromData(data)
      } else {
        sigCanvas.current?.clear()
      }
    }

    // Only resize on mount and significant orientation changes to avoid UI flicker
    resizeCanvas()
    
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [])

  const handleSave = () => {
    if (sigCanvas.current?.isEmpty()) return
    const dataUrl = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png')
    if (dataUrl) {
      onSave(dataUrl)
    }
  }

  const handleClear = () => {
    sigCanvas.current?.clear()
    setIsEmpty(true)
  }

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center z-[100] p-4 animate-in fade-in duration-500">
      <div className="bg-white rounded-[32px] p-6 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-[#002878]">Signature Client</h3>
          <button 
            onClick={onCancel}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="border-2 border-dashed border-slate-200 rounded-[28px] overflow-hidden bg-slate-50 relative group transition-all hover:border-[#002878]/30">
          <SignatureCanvas
            ref={sigCanvas}
            penColor="#00236f"
            canvasProps={{
              className: "w-full h-64 cursor-crosshair",
              style: { width: '100%', height: '256px' }
            }}
            onBegin={() => setIsEmpty(false)}
          />
          {isEmpty && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 font-bold italic opacity-30 select-none">
              Signez ici...
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mt-8">
          <button
            onClick={handleClear}
            disabled={isLoading}
            className="py-4 px-6 border-2 border-slate-200 rounded-2xl font-black text-slate-500 hover:bg-slate-50 transition-all uppercase tracking-widest text-xs disabled:opacity-50"
          >
            Effacer
          </button>
          <button
            onClick={handleSave}
            disabled={isEmpty || isLoading}
            className={`py-4 px-6 rounded-2xl font-black text-white shadow-lg transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 ${
              isEmpty || isLoading
                ? 'bg-slate-200 cursor-not-allowed' 
                : 'bg-[#002878] hover:scale-[1.02] shadow-[#002878]/20'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Traitement...
              </>
            ) : (
              'Valider la signature'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
