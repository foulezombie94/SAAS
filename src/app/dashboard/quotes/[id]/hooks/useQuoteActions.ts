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
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)

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
        backgroundColor: '#ffffff'
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

  // 📊 DOWNLOAD EXCEL
  const handleDownloadExcel = useCallback(async () => {
    try {
      setIsGeneratingExcel(true)
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Devis')

      // Styles & Header
      worksheet.columns = [
        { header: 'Description', key: 'desc', width: 40 },
        { header: 'Quantité', key: 'qty', width: 15 },
        { header: 'Prix Unitaire HT', key: 'unit', width: 20 },
        { header: 'Taux TVA', key: 'tax', width: 15 },
        { header: 'Total HT', key: 'total', width: 20 }
      ]

      quote.quote_items?.forEach(item => {
        worksheet.addRow({
          desc: item.description,
          qty: item.quantity,
          unit: item.unit_price,
          tax: (item.tax_rate || quote.tax_rate || 20) + '%',
          total: item.total_ht
        })
      })

      // Totals
      worksheet.addRow([])
      worksheet.addRow(['', '', '', 'Total HT', quote.total_ht])
      worksheet.addRow(['', '', '', 'Total TTC', quote.total_ttc])

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `Devis_${quote.number}.xlsx`
      anchor.click()
      window.URL.revokeObjectURL(url)
      toast.success("Excel téléchargé avec succès")
    } catch (error) {
      console.error('Excel Generation Error:', error)
      toast.error("Erreur lors de la génération du fichier Excel")
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
      toast.error("Erreur lors de la copie du lien : " + error.message)
    } finally {
      setIsGeneratingLink(false)
    }
  }, [quote, setCurrentQuote])

  // 🖨️ PRINT
  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  // ✍️ SAVE SIGNATURE
  const handleSaveSignature = useCallback(async (signatureData: string) => {
    try {
      setIsSigning(true)
      // On utilise l'action côté client pour la signature artisan
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
      toast.success("Devis signé et approuvé !")
      router.refresh()
    } catch (e: any) {
      toast.error("Échec de la signature : " + e.message)
      setIsSigning(false)
    }
  }, [quote.id, router, setCurrentQuote, setSignature])

  // 💰 CREATE PAYMENT (STRIPE)
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
      toast.error("Erreur lors de l'initialisation du paiement")
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
        toast.success("Facture générée avec succès !")
        router.push(`/dashboard/invoices/${result.invoiceId}`)
      } else {
        throw new Error(result.error)
      }
    } catch (e: any) {
      toast.error("Erreur lors de la génération : " + e.message)
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
      setIsEmailModalOpen
    },
    handlers: {
      handleDownloadPdf,
      handleDownloadExcel,
      handleCopyShareLink,
      handlePrint,
      handleSaveSignature,
      handleCreatePayment,
      handleCreateInvoice
    }
  }
}
