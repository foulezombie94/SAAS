import React from 'react'
import { Quote } from '@/types/dashboard'
import { QuotePreview } from './QuotePreview'

interface PdfTemplateProps {
  quote: Quote
}

/**
 * 📄 PDF Template - Unified Version
 * This component is used as a hidden target for html2canvas capture.
 * It uses the same QuotePreview that the user sees in the dashboard to ensure parity.
 */
export function PdfTemplate({ quote }: PdfTemplateProps) {
  return (
    <div 
      id="pdf-template" 
      className="bg-white" 
      style={{ 
        width: '210mm', 
        minHeight: '297mm', 
        position: 'relative'
      }}
    >
      <QuotePreview 
        quote={quote} 
        isForPdf={true} 
      />
    </div>
  )
}
