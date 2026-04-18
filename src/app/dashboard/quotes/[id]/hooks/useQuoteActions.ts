import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation' // still used by handleCreateInvoice
import { toast } from 'sonner'
import ExcelJS from 'exceljs'
import { createClient } from '@/utils/supabase/client'
import { Quote, QuoteStatus } from '@/types/dashboard'
import { 
  acceptQuoteAction, 
  createInvoiceFromQuoteAction 
} from '@/app/dashboard/quotes/actions'
import { StripeService } from '@/lib/services/stripe.service'
import { QuoteService, SendEmailParams } from '@/lib/services/quote.service'

interface UseQuoteActionsProps {
  quote: Quote
  setCurrentQuote: React.Dispatch<React.SetStateAction<Quote>>
}

/**
 * 🚀 useQuoteActions - Enterprise Grade Refactor
 * Orchestrates business logic using a Clean Architecture service layer.
 */
export function useQuoteActions({ quote, setCurrentQuote }: UseQuoteActionsProps) {
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

  // 📄 DOWNLOAD PDF (SERVER-SIDE)
  const handleDownloadPdf = useCallback(async () => {
    try {
      setIsGeneratingPdf(true)
      await QuoteService.downloadPdf(quote.id, quote.number)
      toast.success("PDF professionnel généré côté serveur !")
    } catch (error: unknown) {
      console.error('PDF Download Error:', error)
      const message = error instanceof Error ? error.message : "Erreur lors de la génération"
      toast.error(`Erreur PDF : ${message}`)
    } finally {
      setIsGeneratingPdf(false)
    }
  }, [quote.id, quote.number])

  // 📧 SEND EMAIL (IMPLEMENTED)
  const handleSendEmail = useCallback(async (params: Omit<SendEmailParams, 'quoteId'>) => {
    try {
      setIsSendingEmail(true)
      await QuoteService.sendEmail({
        quoteId: quote.id,
        ...params
      })
      
      // Update status if it's currently draft
      if (quote.status === 'draft') {
        setCurrentQuote(prev => ({ ...prev, status: 'sent' }))
      }
      
      toast.success("Email envoyé avec succès !")
      setIsEmailModalOpen(false)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Échec de l'envoi"
      toast.error("Erreur Email : " + message)
    } finally {
      setIsSendingEmail(false)
    }
  }, [quote.id, quote.status, setCurrentQuote])

  // 🔗 COPY SHARE LINK
  const handleCopyShareLink = useCallback(async () => {
    try {
      setIsGeneratingLink(true)
      const { token, url } = await QuoteService.getShareLink(quote)
      
      // Update local state if token was just generated
      if (!quote.public_token) {
        setCurrentQuote(prev => ({ ...prev, public_token: token }))
      }

      await navigator.clipboard.writeText(url)

      // Auto-update status for better UX
      if (quote.status === 'draft') {
        const supabase = createClient()
        await supabase.from('quotes').update({ status: 'sent' }).eq('id', quote.id)
        setCurrentQuote(prev => ({ ...prev, status: 'sent' }))
      }

      toast.success("Lien de partage copié !")
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erreur link"
      toast.error(message)
    } finally {
      setIsGeneratingLink(false)
    }
  }, [quote, setCurrentQuote])

  // 💰 CREATE PAYMENT (STRIPE SERVICE)
  const handleCreatePayment = useCallback(async () => {
    try {
      setIsPaying(true)
      const checkoutUrl = await StripeService.createCheckoutSession(quote.id)
      window.location.href = checkoutUrl
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erreur Stripe"
      toast.error(message)
    } finally {
      setIsPaying(false)
    }
  }, [quote.id])

  // 📊 DOWNLOAD EXCEL
  const handleDownloadExcel = useCallback(async () => {
    try {
      setIsGeneratingExcel(true)
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Devis')

      // Branding Header
      worksheet.mergeCells('A1:E1')
      const headerCell = worksheet.getCell('A1')
      headerCell.value = `ARTISAN FLOW - DEVIS #${quote.number}`
      headerCell.font = { name: 'Arial Black', size: 16, color: { argb: 'FFFFFFFF' } }
      headerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } }
      headerCell.alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getRow(1).height = 40

      // Info Table
      worksheet.addRow([])
      worksheet.addRow(['EMETTEUR', '', '', 'DESTINATAIRE'])
      worksheet.addRow([quote.profiles?.company_name || 'Artisan Flow', '', '', quote.clients?.name || 'Client'])
      
      const items = quote.quote_items || []
      worksheet.columns = [
        { header: 'DÉSIGNATION', key: 'desc', width: 45 },
        { header: 'QUANTITÉ', key: 'qty', width: 12 },
        { header: 'PRIX UNIT. HT (€)', key: 'price', width: 18 },
        { header: 'TVA (%)', key: 'tax', width: 10 },
        { header: 'TOTAL HT (€)', key: 'total', width: 18 },
      ]

      items.forEach(item => {
        worksheet.addRow({
          desc: item.description?.toUpperCase() || '',
          qty: item.quantity || 0,
          price: item.unit_price || 0,
          tax: item.tax_rate || 20,
          total: item.total_price || 0
        })
      })

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `Devis_${quote.number}.xlsx`
      anchor.click()
      window.URL.revokeObjectURL(url)
      toast.success("Excel généré !")
    } catch (error) {
      console.error('Excel Generation Error:', error)
      toast.error("Erreur lors de la génération Excel")
    } finally {
      setIsGeneratingExcel(false)
    }
  }, [quote])

  // ✍️ SAVE SIGNATURE
  const handleSaveSignature = useCallback(async (signatureData: string) => {
    try {
      setIsSigning(true)
      const result = await acceptQuoteAction({
        quoteId: quote.id,
        signatureDataUrl: signatureData,
        signerType: 'artisan'
      })
      
      if (!result.success) throw new Error(result.error)
      
      // 🚀 INSTANT STATE UPDATE (No second fetch needed)
      setCurrentQuote(prev => ({
        ...prev,
        status: (result.status as QuoteStatus) || prev.status,
        artisan_signature_url: result.artisanSignatureUrl || prev.artisan_signature_url,
        client_signature_url: result.clientSignatureUrl || prev.client_signature_url,
      }))
      
      setIsSigPadOpen(false)
      toast.success("Signature validée !")
      // The realtime subscription will also broadcast this to other clients/tabs.
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Échec signature"
      toast.error(message)
    } finally {
      setIsSigning(false)
    }
  }, [quote.id, quote.client_signature_url, setCurrentQuote])

  // 🧾 CREATE INVOICE
  const handleCreateInvoice = useCallback(async () => {
    try {
      setIsGeneratingInvoice(true)
      const result = await createInvoiceFromQuoteAction(quote.id)
      if (result.success) {
        toast.success("Facture générée !")
        router.push(`/dashboard/invoices/${result.invoiceId}`)
      } else throw new Error(result.error)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erreur facturation"
      toast.error(message)
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
      handleCreateInvoice,
      handleSendEmail
    }
  }
}

