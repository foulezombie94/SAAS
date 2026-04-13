import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import ExcelJS from 'exceljs'
import { createClient } from '@/utils/supabase/client'
import { Quote } from '@/types/dashboard'
import { 
  acceptQuoteAction, 
  createInvoiceFromQuoteAction,
  generateQuoteTokenAction 
} from '@/app/dashboard/quotes/actions'

interface UseQuoteActionsProps {
  quote: Quote
  setCurrentQuote: React.Dispatch<React.SetStateAction<Quote>>
}

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

  // 📄 DOWNLOAD PDF
  const handleDownloadPdf = useCallback(async () => {
    const element = document.getElementById('pdf-template')
    if (!element) return

    try {
      setIsGeneratingPdf(true)
      
      // 🛡️ REFINED CLEANUP: Temporarily sanitize styles without breaking layout
      const allStyles = Array.from(document.querySelectorAll('style'));
      const originalContents = allStyles.map(s => s.innerHTML);
      allStyles.forEach(s => {
        if (s.innerHTML.includes('lab(') || s.innerHTML.includes('oklch(')) {
          s.innerHTML = s.innerHTML
            .replace(/lab\([^)]*\)/g, '#1e293b')
            .replace(/oklch\([^)]*\)/g, '#1e293b');
        }
      });

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          // 🛡️ ULTIMATE SAFETY: Injected styles to force compatibility
          const style = clonedDoc.createElement('style');
          style.innerHTML = `
            #pdf-template { font-family: Arial, sans-serif !important; }
            #pdf-template * { border-color: #e2e8f0 !important; }
          `;
          clonedDoc.head.appendChild(style);

          // 1. Sanitize all style tags
          const styleTags = clonedDoc.getElementsByTagName('style');
          for (let i = 0; i < styleTags.length; i++) {
            const s = styleTags[i];
            if (s.innerHTML) {
              s.innerHTML = s.innerHTML
                .replace(/lab\([^)]*\)/g, '#1e293b')
                .replace(/oklch\([^)]*\)/g, '#1e293b')
                .replace(/color-mix\([^)]*\)/g, '#1e293b');
            }
          }

          // 2. Comprehensive Computed Style Scan (Safest Method)
          const allElements = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < allElements.length; i++) {
            const el = allElements[i] as HTMLElement;
            try {
              const comp = window.getComputedStyle(el);
              // If any modern color is detected in computed style, force an inline HEX fallback
              if (comp.color?.includes('lab') || comp.color?.includes('oklch')) {
                el.style.color = '#1e293b';
              }
              if (comp.backgroundColor?.includes('lab') || comp.backgroundColor?.includes('oklch')) {
                el.style.backgroundColor = el.tagName === 'DIV' ? '#ffffff' : 'transparent';
              }
              if (comp.borderColor?.includes('lab') || comp.borderColor?.includes('oklch')) {
                el.style.borderColor = '#e2e8f0';
              }
            } catch (e) {
              // Ignore elements where getComputedStyle might fail
            }
          }
        }
      })
      
      // 🔄 RESTORE original styles in the real DOM
      allStyles.forEach((s, i) => { s.innerHTML = originalContents[i]; });
      
      // OPTIMIZATION: Convert to compressed JPEG to drastically reduce PDF weight (under 50KB logo equivalent)
      const imgData = canvas.toDataURL('image/jpeg', 0.8)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight, undefined, 'FAST')
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

      // 3. Table Header (Premium Indigo Style)
      worksheet.columns = [
        { header: 'DÉSIGNATION', key: 'desc', width: 45 },
        { header: 'QUANTITÉ', key: 'qty', width: 12 },
        { header: 'PRIX UNIT. HT (€)', key: 'price', width: 18 },
        { header: 'TVA (%)', key: 'tax', width: 10 },
        { header: 'TOTAL HT (€)', key: 'total', width: 18 },
      ]

      const headerRow = worksheet.getRow(worksheet.rowCount)
      headerRow.height = 30
      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } }
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
      })

      // 4. Data Rows (Robust Mapping with zebra striping)
      const items = quote.quote_items || []
      items.forEach((item, index) => {
        const qty = Number(item.quantity) || 1
        const price = Number(item.unit_price) || 0
        const row = worksheet.addRow({
          desc: (item.description || 'PRESTATION').toUpperCase(),
          qty: qty,
          price: price,
          tax: item.tax_rate || quote.tax_rate || 20,
          total: (qty * price)
        })
        
        row.height = 25
        row.alignment = { vertical: 'middle' }
        if (index % 2 === 1) {
          row.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
          })
        }

        row.getCell(3).numFmt = '#,##0.00 "€"'
        row.getCell(5).numFmt = '#,##0.00 "€"'
        row.getCell(1).font = { bold: true, color: { argb: 'FF1E293B' } }
      })

      // 5. Totals Section
      worksheet.addRow([])
      
      const addSummary = (label: string, value: number, isFinal = false) => {
        const row = worksheet.addRow(['', '', '', label, value])
        row.height = 28
        row.getCell(4).font = { bold: true, size: 10, color: { argb: 'FF64748B' } }
        row.getCell(5).font = { bold: true, size: 11, color: { argb: 'FF1E293B' } }
        row.getCell(5).numFmt = '#,##0.00 "€"'
        
        if (isFinal) {
          row.getCell(4).font = { name: 'Arial Black', size: 12, color: { argb: 'FFFFFFFF' } }
          row.getCell(5).font = { name: 'Arial Black', size: 14, color: { argb: 'FFFFFFFF' } }
          row.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002878' } }
          row.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002878' } }
        }
      }

      addSummary('SOUS-TOTAL HT', quote.total_ht || 0)
      addSummary('TVA (20%)', (quote.total_ttc || 0) - (quote.total_ht || 0))
      addSummary('TOTAL TTC À RÉGLER', quote.total_ttc || 0, true)

      // Signature Status
      worksheet.addRow([])
      const sigHeader = worksheet.addRow(['', 'ÉTAT DES SIGNATURES CONTRACTUELLES'])
      sigHeader.font = { bold: true, size: 9, color: { argb: 'FF4F46E5' } }
      
      const artSig = worksheet.addRow(['', `ARTISAN : ${quote.artisan_signature_url ? 'SIGNÉ LE ' + new Date().toLocaleDateString() : 'EN ATTENTE'}`])
      artSig.font = { size: 9, color: { argb: quote.artisan_signature_url ? 'FF059669' : 'FFD97706' }, bold: true }
      
      const cliSig = worksheet.addRow(['', `CLIENT : ${quote.client_signature_url ? 'SIGNÉ LE ' + new Date().toLocaleDateString() : 'EN ATTENTE'}`])
      cliSig.font = { size: 9, color: { argb: quote.client_signature_url ? 'FF059669' : 'FFD97706' }, bold: true }

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

      // Automatically mark as sent if it was a draft
      if (quote.status === 'draft') {
        const supabase = createClient()
        const { error: updateError } = await supabase
          .from('quotes')
          .update({ status: 'sent', updated_at: new Date().toISOString() })
          .eq('id', quote.id)
        
        if (!updateError) {
          setCurrentQuote(prev => ({ ...prev, status: 'sent' }))
        } else {
          console.error("Failed to update quote status to sent:", updateError)
        }
      }

      toast.success("Lien de partage copié !")
    } catch (error: any) {
      toast.error("Erreur link : " + error.message)
    } finally {
      setIsGeneratingLink(false)
    }
  }, [quote.id, quote.public_token, quote.status, setCurrentQuote])

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
      
      const newSignature = result.signatureUrl || null
      
      setCurrentQuote(prev => ({
        ...prev,
        artisan_signature_url: newSignature
      }))
      
      setIsSigning(false)
      setIsSigPadOpen(false)
      toast.success("Votre signature (Artisan) a été enregistrée !")
      router.refresh()
    } catch (e: any) {
      toast.error("Échec : " + e.message)
      setIsSigning(false)
    }
  }, [quote.id, router, setCurrentQuote])

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
