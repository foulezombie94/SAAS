'use client'

import React, { useRef, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Button } from './ui/Button'
import { Eraser, Check, X } from 'lucide-react'

interface SignaturePadProps {
  onSave: (signatureDataUrl: string) => void
  onCancel: () => void
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onCancel }) => {
  const sigCanvas = useRef<SignatureCanvas>(null)
  const [isEmpty, setIsEmpty] = useState(true)

  const clear = () => {
    sigCanvas.current?.clear()
    setIsEmpty(true)
  }

  const save = () => {
    if (sigCanvas.current?.isEmpty()) return
    const dataUrl = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png')
    if (dataUrl) {
      onSave(dataUrl)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-6 bg-surface border border-outline-variant/30 rounded-xl shadow-2xl animate-in zoom-in-95 duration-300 max-w-2xl w-full mx-auto">
      <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
        <h3 className="text-xl font-black text-primary uppercase tracking-tighter">Signature Client</h3>
        <button onClick={onCancel} className="text-on-surface-variant/40 hover:text-error transition-colors">
          <X size={24} />
        </button>
      </div>

      <div className="bg-white border-2 border-dashed border-outline-variant/50 rounded-lg overflow-hidden cursor-crosshair">
        <SignatureCanvas 
          ref={sigCanvas}
          penColor="#00236f"
          canvasProps={{
            className: "w-full h-64",
            style: { width: '100%', height: '256px' }
          }}
          onBegin={() => setIsEmpty(false)}
        />
      </div>

      <div className="flex items-center justify-between mt-2">
        <p className="text-xs font-bold text-on-surface-variant/50 uppercase tracking-widest">
          Utilisez votre souris ou trackpad pour signer
        </p>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={clear} className="text-error hover:bg-error/10">
            <Eraser size={16} className="mr-2" /> Effacer
          </Button>
          <Button onClick={save} disabled={isEmpty} className="shadow-diffused">
            <Check size={16} className="mr-2" /> Valider la signature
          </Button>
        </div>
      </div>
    </div>
  )
}
