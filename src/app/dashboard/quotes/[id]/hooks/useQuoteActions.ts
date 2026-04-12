import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import ExcelJS from 'exceljs'
import { Quote } from '@/types/dashboard'
import { 
  acceptQuoteAction, 
  createInvoiceFromQuoteAction,
  generateQuoteTokenAction 
} from '@/app/dashboard/quotes/actions'

interface UseQuoteActionsProps {
  quote: Quote
  setCurrentQuote: React.Dispatch<React.SetStateAction<Quote>>
  setSignature: (url: string | null) => void
}

export function useQuoteActions({ quote, setCurrentQuote, setSignature }: UseQuoteActionsProps) {
  const router = useRouter()
  
  // Loading States
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false)
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)
  const [isSigning, setIsSigning] = useState(false)
  const [isPaying, setIsPaying] = useState(false)
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  
  // Modal/UI States
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)
  const [isSigPadOpen, setIsSigPadOpen] = useState(false)

  // 📄 DOWNLOAD PDF
  const handleDownloadPdf = useCallback(async () => {
    const element = document.getElementById('pdf-template')
    if (!element) return

    try {
      setIsGeneratingPdf(true)
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const styleTags = clonedDoc.getElementsByTagName('style');
          for (let i = 0; i < styleTags.length; i++) {
            const style = styleTags[i];
            if (style.innerHTML.includes('lab(') || style.innerHTML.includes('oklch(')) {
              style.innerHTML = style.innerHTML.replace(/lab\([^)]+\)/g, '#000000');
              style.innerHTML = style.innerHTML.replace(/oklch\([^)]+\)/g, '#000000');
            }
          }
          const template = clonedDoc.getElementById('pdf-template');
          if (template) {
            template.style.fontFamily = 'Arial, sans-serif';
          }
        }
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
      pdf.save(`Devis_${quote.number}.pdf`)
      toast.success("PDF téléchargé avec succès")
    } catch (error) {
      console.error('PDF Generation Error:', error)
      toast.error("Erreur lors de la génération du PDF")
    } finally {
      setIsGeneratingPdf(false)
    }
  }, [quote.number])

  // 📊 DOWNLOAD EXCEL (PREMIUM VERSION)
  const handleDownloadExcel = useCallback(async () => {
    try {
      setIsGeneratingExcel(true)
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Devis')

      // 1. Branding Header
      worksheet.mergeCells('A1:E1')
      const headerCell = worksheet.getCell('A1')
      headerCell.value = `ARTISAN FLOW - DEVIS #${quote.number}`
      headerCell.font = { name: 'Arial Black', size: 16, color: { argb: 'FFFFFFFF' } }
      headerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } }
      headerCell.alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getRow(1).height = 40

      // 2. Info Company & Client
      worksheet.addRow([])
      worksheet.addRow(['EMETTEUR', '', '', 'DESTINATAIRE'])
      worksheet.getCell('A3').font = { bold: true, size: 10, color: { argb: 'FF94A3B8' } }
      worksheet.getCell('D3').font = { bold: true, size: 10, color: { argb: 'FF94A3B8' } }
      
      worksheet.addRow([quote.profiles?.company_name || 'Artisan Flow', '', '', quote.clients?.name || 'Client'])
      worksheet.getCell('A4').font = { bold: true }
      worksheet.getCell('D4').font = { bold: true }
      
      worksheet.addRow([quote.profiles?.address || '', '', '', quote.clients?.address || ''])
      worksheet.addRow([quote.profiles?.email || '', '', '', quote.clients?.city || ''])

      worksheet.addRow([])
      worksheet.addRow([])

      // 3. Table Header
      const tableHeaderRow = worksheet.addRow(['DESCRIPTION', 'QTÉ', 'PRIX UNIT. HT', 'TVA', 'TOTAL HT'])
      tableHeaderRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      })

      // 4. Data Rows
      quote.quote_items?.forEach(item => {
        const row = worksheet.addRow([
          item.description,
          item.quantity,
          item.unit_price,
          (item.tax_rate || quote.tax_rate || 20) + '%',
          item.total_ht
        ])
        
        row.getCell(3).numFmt = '#,##0.00 "€"'
        row.getCell(5).numFmt = '#,##0.00 "€"'
        row.alignment = { vertical: 'middle' }
        
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFF1F5F9' } },
            left: { style: 'thin', color: { argb: 'FFF1F5F9' } },
            bottom: { style: 'thin', color: { argb: 'FFF1F5F9' } },
            right: { style: 'thin', color: { argb: 'FFF1F5F9' } }
          }
        })
      })

      // 5. Totals Section
      worksheet.addRow([])
      const htRow = worksheet.addRow(['', '', '', 'TOTAL HT', quote.total_ht])
      htRow.getCell(4).font = { bold: true, size: 11 }
      htRow.getCell(5).font = { bold: true, size: 11 }
      htRow.getCell(5).numFmt = '#,##0.00 "€"'

      const ttcRow = worksheet.addRow(['', '', '', 'TOTAL TTC', quote.total_ttc])
      ttcRow.getCell(4).font = { name: 'Arial Black', size: 12, color: { argb: 'FF4F46E5' } }
      ttcRow.getCell(5).font = { name: 'Arial Black', size: 14, color: { argb: 'FF4F46E5' } }
      ttcRow.getCell(5).numFmt = '#,##0.00 "€"'
      worksheet.getRow(ttcRow.number).height = 30

      // Columns Width
      worksheet.getColumn(1).width = 50
      worksheet.getColumn(2).width = 10
      worksheet.getColumn(3).width = 20
      worksheet.getColumn(4).width = 15
      worksheet.getColumn(5).width = 20

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `Devis_${quote.number}_${quote.clients?.name?.replace(/\s+/g, '_')}.xlsx`
      anchor.click()
      window.URL.revokeObjectURL(url)
      toast.success("Excel premium généré !")
    } catch (error) {
      console.error('Excel Generation Error:', error)
      toast.error("Erreur lors de la génération Excel")
    } finally {
      setIsGeneratingExcel(false)
    }
  }, [quote])

  // 🔗 COPY SHARE LINK
  const handleCopyShareLink = useCallback(async () => {
    try {
      setIsGeneratingLink(true)
      let token = quote.public_token
      if (!token) {
        const result = await generateQuoteTokenAction(quote.id)
        if (result.success && result.token) {
          token = result.token
          setCurrentQuote(prev => ({ 
            ...prev, 
            public_token: result.token ?? null,
            public_token_expires_at: result.expiresAt ?? null
          }))
        } else {
          throw new Error(result.error)
        }
      }
      const shareUrl = `${window.location.origin}/share/quotes/${quote.id}?token=${token}`
      await navigator.clipboard.writeText(shareUrl)
      toast.success("Lien de partage copié !")
    } catch (error: any) {
      toast.error("Erreur link : " + error.message)
    } finally {
      setIsGeneratingLink(false)
    }
  }, [quote, setCurrentQuote])

  // ✍️ SAVE SIGNATURE
  const handleSaveSignature = useCallback(async (signatureData: string) => {
    try {
      setIsSigning(true)
      const result = await acceptQuoteAction({
        quoteId: quote.id,
        signatureDataUrl: signatureData
      })
      if (!result.success) throw new Error(result.error)
      const newSignature = result.signatureUrl || null
      setSignature(newSignature)
      setCurrentQuote(prev => ({ 
        ...prev, 
        status: 'accepted' as const, 
        signature_url: newSignature 
      }))
      setIsSigning(false)
      setIsSigPadOpen(false)
      toast.success("Devis signé et approuvé !")
      router.refresh()
    } catch (e: any) {
      toast.error("Échec : " + e.message)
      setIsSigning(false)
    }
  }, [quote.id, router, setCurrentQuote, setSignature])

  // 💰 CREATE PAYMENT
  const handleCreatePayment = useCallback(async () => {
    try {
      setIsPaying(true)
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          quoteId: quote.id,
          successUrl: `${window.location.origin}/dashboard/quotes/${quote.id}?success=true`,
          cancelUrl: `${window.location.origin}/dashboard/quotes/${quote.id}?canceled=true`
        })
      })
      const data = await response.json()
      if (data.url) window.location.href = data.url
      else throw new Error(data.error || 'Erreur Stripe')
    } catch (error) {
      toast.error("Erreur paiement")
    } finally {
      setIsPaying(false)
    }
  }, [quote.id])

  // 🧾 CREATE INVOICE
  const handleCreateInvoice = useCallback(async () => {
    try {
      setIsGeneratingInvoice(true)
      const result = await createInvoiceFromQuoteAction(quote.id)
      if (result.success) {
        toast.success("Facture générée !")
        router.push(`/dashboard/invoices/${result.invoiceId}`)
      } else throw new Error(result.error)
    } catch (e: any) {
      toast.error("Erreur : " + e.message)
    } finally {
      setIsGeneratingInvoice(false)
    }
  }, [quote.id, router])

  return {
    loading: {
      isGeneratingPdf,
      isGeneratingExcel,
      isGeneratingLink,
      isSigning,
      isPaying,
      isGeneratingInvoice,
      isSendingEmail,
    },
    modals: {
      isEmailModalOpen,
      setIsEmailModalOpen,
      isSigPadOpen,
      setIsSigPadOpen
    },
    handlers: {
      handleDownloadPdf,
      handleDownloadExcel,
      handleCopyShareLink,
      handleSaveSignature,
      handleCreatePayment,
      handleCreateInvoice
    }
  }
}
