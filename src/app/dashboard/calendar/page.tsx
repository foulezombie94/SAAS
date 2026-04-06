'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Users, Clock, Share2, Mail, CheckCircle2, Box, ArrowRight, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { createIntervention, getInterventions, deleteIntervention, updateInterventionStatus, sendInterventionReminder } from './actions'
import { toast } from 'sonner'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addDays } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useSearchParams, useRouter } from 'next/navigation'

function CalendarContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [interventions, setInterventions] = useState<any[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showModal, setShowModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    client_id: '',
    quote_id: ''
  })

  // 1. Initial Load & Pre-fill from URL
  useEffect(() => {
    fetchInterventions()
    
    // Check for pre-fill params
    const quoteId = searchParams.get('quote_id')
    const clientId = searchParams.get('client_id')
    const title = searchParams.get('title')
    
    if (quoteId || title) {
      setFormData(prev => ({
        ...prev,
        quote_id: quoteId || '',
        client_id: clientId || '',
        title: title || '',
        start_time: format(new Date(), "yyyy-MM-dd'T'09:00"),
        end_time: format(new Date(), "yyyy-MM-dd'T'11:00")
      }))
      setShowModal(true)
    }
  }, [searchParams])

  async function fetchInterventions() {
    setLoading(true)
    const data = await getInterventions()
    setInterventions(data)
    setLoading(false)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.start_time || !formData.end_time) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    const res = await createIntervention(formData)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Rendez-vous planifié !')
      setShowModal(false)
      fetchInterventions()
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    const res = await updateInterventionStatus(id, status)
    if (res.error) {
      toast.error(res.error)
    } else {
      if (status === 'completed') {
        toast.success('Intervention terminée !', {
          description: "Voulez-vous générer la facture maintenant ?",
          action: res.data?.quote_id ? {
            label: "Générer la facture",
            onClick: () => router.push(`/dashboard/quotes/${res.data.quote_id}`)
          } : undefined
        })
      }
      setSelectedEvent(null)
      fetchInterventions()
    }
  }

  const handleSendReminder = async (id: string) => {
    const toastId = toast.loading("Envoi du rappel au client...")
    const res = await sendInterventionReminder(id)
    if (res.error) {
      toast.error(res.error, { id: toastId })
    } else {
      toast.success("Rappel envoyé avec succès !", { id: toastId })
      fetchInterventions()
    }
  }

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  })

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <CalendarIcon size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/40">Master Architect</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-primary uppercase">Planning d'Exécution</h1>
          <p className="text-on-surface-variant flex items-center gap-2 mt-1">
             <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
             Lien direct Devis ↔️ Chantier actif
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-surface-container-low p-1.5 rounded-xl border border-slate-100 flex items-center gap-1">
             <button onClick={() => setCurrentDate(addDays(currentDate, -30))} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all">
               <ChevronLeft size={18} />
             </button>
             <span className="px-4 text-[11px] font-black uppercase tracking-widest text-primary w-44 text-center">
               {format(currentDate, 'MMMM yyyy', { locale: fr })}
             </span>
             <button onClick={() => setCurrentDate(addDays(currentDate, 30))} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all">
               <ChevronRight size={18} />
             </button>
          </div>
          <Button 
            onClick={() => {
              setFormData({title:'', description:'', start_time:'', end_time:'', client_id:'', quote_id:''})
              setShowModal(true)
            }}
            className="h-14 px-8 bg-primary text-white rounded-2xl shadow-xl shadow-primary/20 flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Plus size={20} />
            <span className="font-black uppercase tracking-widest text-[10px]">Nouveau Chantier</span>
          </Button>
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-9">
          <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
            <div className="grid grid-cols-7 border-b border-slate-50 bg-slate-50/50">
              {['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'].map((day) => (
                <div key={day} className="py-6 text-center text-[10px] font-black text-slate-400 tracking-[0.3em] border-r border-slate-50 last:border-r-0 uppercase">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 auto-rows-[minmax(160px,auto)]">
              {daysInMonth.map((day: Date, i: number) => {
                const dayInterventions = interventions.filter(int => isSameDay(new Date(int.start_time), day))
                
                return (
                  <div key={i} className="p-4 border-r border-b border-slate-50 relative group transition-all hover:bg-slate-50/80 min-h-[160px]">
                    <span className={`text-lg font-black tracking-tighter ${isSameDay(day, new Date()) ? 'text-primary' : 'text-slate-200'}`}>
                      {format(day, 'd')}
                    </span>
                    
                    <div className="mt-4 space-y-2">
                      {dayInterventions.map((int, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => setSelectedEvent(int)}
                          className={`p-3 rounded-2xl text-[10px] font-black leading-tight shadow-lg cursor-pointer hover:scale-[1.02] transition-all border border-white/20 uppercase tracking-tighter ${
                            int.status === 'completed' ? 'bg-slate-900 text-white opacity-50' : 'bg-primary text-white'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="truncate">{int.title}</span>
                            {int.reminder_sent && <Mail size={10} className="text-emerald-300" />}
                          </div>
                          <div className="flex items-center gap-1 text-[8px] opacity-60 mt-1">
                            <Clock size={10} />
                            {format(new Date(int.start_time), 'HH:mm')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* SIDE ACTIONS */}
        <div className="col-span-12 lg:col-span-3 space-y-8">
           {selectedEvent ? (
             <div className="bg-slate-900 rounded-[40px] p-8 text-white shadow-2xl animate-in slide-in-from-right-4 duration-500">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-white/10 rounded-2xl">
                    <Box size={24} />
                  </div>
                  <button onClick={() => setSelectedEvent(null)} className="p-2 hover:bg-white/10 rounded-full">
                    <Plus size={20} className="rotate-45" />
                  </button>
                </div>
                
                <h3 className="text-2xl font-black tracking-tighter mb-2 uppercase">{selectedEvent.title}</h3>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-6">Statut: {selectedEvent.status}</p>

                <div className="space-y-4 mb-10">
                   <div className="flex items-center gap-3 text-sm font-bold text-white/70">
                     <Clock size={18} /> {format(new Date(selectedEvent.start_time), "EEEE d MMMM", {locale: fr})}
                   </div>
                   {selectedEvent.client && (
                      <div className="flex items-center gap-3 text-sm font-bold text-white/70">
                        <Users size={18} /> {selectedEvent.client.name}
                      </div>
                   )}
                </div>

                <div className="flex flex-col gap-3">
                   {selectedEvent.status !== 'completed' && (
                     <Button 
                       onClick={() => handleStatusChange(selectedEvent.id, 'completed')}
                       className="h-14 bg-emerald-500 hover:bg-emerald-600 font-black uppercase tracking-widest text-[10px] w-full gap-2 rounded-2xl"
                     >
                        <CheckCircle2 size={18} /> Terminer l'Exécution
                     </Button>
                   )}
                   
                   <Button 
                      onClick={() => handleSendReminder(selectedEvent.id)}
                      variant="outline"
                      className="h-14 border-white/20 hover:bg-white/10 font-black uppercase tracking-widest text-[10px] w-full gap-2 rounded-2xl text-white"
                   >
                      <Mail size={18} /> Envoyer Rappel Client
                   </Button>

                   <button 
                    onClick={() => {
                      if(confirm("Supprimer ?")) {
                        deleteIntervention(selectedEvent.id).then(() => {
                           fetchInterventions()
                           setSelectedEvent(null)
                        })
                      }
                    }}
                    className="text-[10px] font-black uppercase tracking-widest text-red-400 mt-4 hover:text-red-300 flex items-center justify-center gap-2"
                   >
                     <Trash2 size={14} /> Supprimer le RDV
                   </button>
                </div>
             </div>
           ) : (
             <div className="bg-surface-container-high rounded-[40px] p-8 border border-slate-100 h-full">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary/40 mb-10">Selectionner un chantier</h3>
                <div className="flex flex-col items-center justify-center h-64 text-center opacity-20">
                   <Share2 size={64} className="mb-4" />
                   <p className="text-xs font-bold uppercase tracking-widest">Cliquez sur un rendez-vous pour gérer l'exécution</p>
                </div>
             </div>
           )}
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[40px] p-10 shadow-3xl border border-slate-100 animate-in zoom-in-95 duration-300">
            <h2 className="text-4xl font-black tracking-tighter text-primary mb-8 uppercase">Planification</h2>
            
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Objet de l'intervention</label>
                <input 
                  type="text" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 focus:ring-4 focus:ring-primary/5 outline-none font-bold text-sm" 
                  placeholder="Ex: Chantier Salle de Bain..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Début</label>
                  <input 
                    type="datetime-local" 
                    value={formData.start_time}
                    onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                    className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 outline-none font-bold text-sm" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fin</label>
                  <input 
                    type="datetime-local" 
                    value={formData.end_time}
                    onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                    className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 outline-none font-bold text-sm" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description / Détails</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full h-32 bg-slate-50 border-none rounded-2xl p-6 outline-none font-bold text-sm resize-none" 
                  placeholder="Notes de chantier..."
                />
              </div>

              <div className="flex gap-4 pt-6">
                <Button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  variant="outline" 
                  className="flex-1 h-16 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                >
                  Annuler
                </Button>
                <Button 
                  type="submit"
                  className="flex-2 h-16 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20 w-2/3"
                >
                  Confirmer le Chantier
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<div>Chargement de l'agenda...</div>}>
      <CalendarContent />
    </Suspense>
  )
}
