'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Users, 
  Clock, 
  Share2, 
  Mail, 
  CheckCircle2, 
  Box, 
  ArrowRight, 
  Trash2,
  LayoutGrid,
  Zap,
  AlignLeft,
  CalendarDays,
  UserPlus,
  StickyNote,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { createIntervention, getInterventions, deleteIntervention, updateInterventionStatus, sendInterventionReminder } from './actions'
import { toast } from 'sonner'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addDays, isToday, isSameMonth } from 'date-fns'
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

  useEffect(() => {
    fetchInterventions()
    
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
    const toastId = toast.loading("Envoi du rappel...")
    const res = await sendInterventionReminder(id)
    if (res.error) {
      toast.error(res.error, { id: toastId })
    } else {
      toast.success("Rappel envoyé !", { id: toastId })
      fetchInterventions()
    }
  }

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  })

  return (
    <div className="flex flex-col gap-10 pb-20 animate-in fade-in duration-700">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="px-3 py-1 bg-primary/5 border border-primary/10 rounded-full flex items-center gap-2">
               <Zap size={12} className="text-primary" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Status: En Ligne</span>
             </div>
             <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Sync. Active</span>
             </div>
          </div>
          <div>
            <h1 className="text-6xl font-black tracking-tighter text-primary uppercase leading-tight">Agenda <span className="text-slate-300">Pro</span></h1>
            <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px] mt-2 ml-1">Système de Planification Haute Fidélité</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="glass-card neon-shadow p-2 rounded-[24px] flex items-center gap-2 bg-white/40 backdrop-blur-md">
             <button onClick={() => setCurrentDate(addDays(currentDate, -30))} className="p-3 hover:bg-white rounded-xl transition-all hover:shadow-sm">
               <ChevronLeft size={20} className="text-primary" />
             </button>
             <div className="px-6 min-w-[200px] text-center">
               <span className="text-xs font-black uppercase tracking-[0.3em] text-primary">
                 {format(currentDate, 'MMMM yyyy', { locale: fr })}
               </span>
             </div>
             <button onClick={() => setCurrentDate(addDays(currentDate, 30))} className="p-3 hover:bg-white rounded-xl transition-all hover:shadow-sm">
               <ChevronRight size={20} className="text-primary" />
             </button>
          </div>
          
          <Button 
            onClick={() => {
              setFormData({title:'', description:'', start_time:'', end_time:'', client_id:'', quote_id:''})
              setShowModal(true)
            }}
            className="group h-[72px] px-10 bg-primary text-white rounded-[24px] shadow-2xl shadow-primary/30 flex items-center gap-4 hover:scale-[1.02] active:scale-95 transition-all overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skewed-x-12" />
            <Plus size={24} className="relative z-10" />
            <span className="font-black uppercase tracking-[0.2em] text-[11px] relative z-10">Programmer Intervention</span>
          </Button>
        </div>
      </div>

      {/* CORE GRID & SIDEBAR */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
        
        {/* MODERN GLASS GRID */}
        <div className="md:col-span-8 lg:col-span-9">
          <div className="glass-card neon-shadow rounded-[48px] overflow-hidden border border-white/40 bg-white/10 backdrop-blur-sm">
            <div className="grid grid-cols-7 border-b border-primary/5 bg-primary/5 backdrop-blur-md">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                <div key={day} className="py-8 text-center text-[10px] font-black text-primary/40 tracking-[0.4em] uppercase">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 auto-rows-[minmax(180px,auto)] bg-white/20">
              {daysInMonth.map((day: Date, i: number) => {
                const dayInterventions = interventions.filter(int => isSameDay(new Date(int.start_time), day))
                const active = isToday(day)
                
                return (
                  <div key={i} className={`p-6 border-r border-b border-primary/5 relative group transition-all hover:bg-primary/[0.02] min-h-[180px] ${!isSameMonth(day, currentDate) ? 'opacity-20' : ''}`}>
                    <div className="flex justify-between items-start">
                      <span className={`text-2xl font-black tracking-tighter transition-all ${active ? 'text-primary scale-125' : 'text-slate-300 group-hover:text-primary/40'}`}>
                        {format(day, 'd')}
                      </span>
                      {active && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                    </div>
                    
                    <div className="mt-6 space-y-3">
                      {dayInterventions.map((int, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => setSelectedEvent(int)}
                          className={`group/item p-4 rounded-[20px] text-[10px] font-black leading-tight shadow-xl cursor-pointer hover:scale-[1.05] transition-all border border-white relative overflow-hidden uppercase tracking-tighter ${
                            int.status === 'completed' 
                              ? 'bg-slate-900 text-white/50 border-slate-800' 
                              : 'bg-white text-primary border-slate-100 hover:border-primary/20'
                          }`}
                        >
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${int.status === 'completed' ? 'bg-emerald-500/30' : 'bg-primary'}`} />
                          <div className="flex justify-between items-center px-1">
                            <span className="truncate pr-2">{int.title}</span>
                            {int.reminder_sent && <Mail size={12} className="text-emerald-500 shrink-0" />}
                          </div>
                          <div className="flex items-center gap-2 text-[8px] font-bold opacity-40 mt-2 px-1">
                            <Clock size={12} />
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

        {/* DETAILS SIDEBAR */}
        <div className="md:col-span-4 lg:col-span-3">
           <div className="sticky top-10 space-y-8">
             {selectedEvent ? (
               <div className="bg-slate-900 rounded-[48px] p-10 text-white shadow-3xl border border-white/10 animate-in slide-in-from-right-10 duration-500 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-5">
                    <Zap size={200} />
                  </div>
                  
                  <div className="flex justify-between items-start mb-10 relative z-10">
                    <div className="p-4 bg-white/10 rounded-2xl">
                      <LayoutGrid size={28} className="text-white" />
                    </div>
                    <button onClick={() => setSelectedEvent(null)} className="p-3 hover:bg-white/10 rounded-full transition-all group">
                      <X size={24} className="group-hover:scale-110" />
                    </button>
                  </div>
                  
                  <div className="relative z-10 mb-10">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] mb-4">Code Mission: {selectedEvent.id.split('-')[0]}</p>
                    <h3 className="text-3xl font-black tracking-tighter uppercase leading-tight mb-4">{selectedEvent.title}</h3>
                    <div className={`inline-flex px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${
                      selectedEvent.status === 'completed' ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' : 'border-white/20 text-white/40'
                    }`}>
                      {selectedEvent.status === 'completed' ? 'Exécuté' : 'À Planifier'}
                    </div>
                  </div>

                  <div className="space-y-6 mb-12 relative z-10">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                          <Clock size={18} className="text-white/40" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase text-white/30 tracking-widest leading-none mb-1">HORAIRE</p>
                          <p className="text-sm font-black uppercase">{format(new Date(selectedEvent.start_time), "HH:mm")} - {format(new Date(selectedEvent.end_time), "HH:mm")}</p>
                        </div>
                     </div>
                     {selectedEvent.description && (
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                            <AlignLeft size={18} className="text-white/40" />
                          </div>
                          <div>
                            <p className="text-[9px] font-black uppercase text-white/30 tracking-widest leading-none mb-2">DESCRIPTION</p>
                            <p className="text-xs font-bold leading-relaxed text-white/60">{selectedEvent.description}</p>
                          </div>
                        </div>
                     )}
                  </div>

                  <div className="flex flex-col gap-4 relative z-10">
                     {selectedEvent.status !== 'completed' && (
                       <Button 
                         onClick={() => handleStatusChange(selectedEvent.id, 'completed',)}
                         className="h-[72px] bg-emerald-500 hover:bg-emerald-600 font-black uppercase tracking-[0.2em] text-[10px] w-full gap-3 rounded-2xl shadow-xl shadow-emerald-900/40 border-none"
                       >
                          <CheckCircle2 size={20} /> Valider l'Exécution
                       </Button>
                     )}
                     
                     <Button 
                        onClick={() => handleSendReminder(selectedEvent.id)}
                        variant="outline"
                        className="h-[72px] border-white/10 hover:bg-white text-slate-900 hover:border-white font-black uppercase tracking-[0.2em] text-[10px] w-full gap-3 rounded-2xl"
                     >
                        <Mail size={20} /> Rappel SMS/Email
                     </Button>

                     <button 
                      onClick={() => {
                        if(confirm("Supprimer cette intervention ?")) {
                          deleteIntervention(selectedEvent.id).then(() => {
                             fetchInterventions()
                             setSelectedEvent(null)
                          })
                        }
                      }}
                      className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500/60 mt-6 hover:text-red-500 flex items-center justify-center gap-2 transition-colors py-4"
                     >
                       <Trash2 size={14} /> Annuler la mission
                     </button>
                  </div>
               </div>
             ) : (
               <div className="glass-card neon-shadow rounded-[48px] p-12 border border-white flex flex-col items-center text-center justify-center min-h-[500px] bg-white/40 backdrop-blur-md">
                  <div className="w-24 h-24 rounded-full bg-primary/5 flex items-center justify-center mb-10">
                    <CalendarDays size={32} className="text-primary/20" />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-[0.4em] text-primary mb-4 opacity-40">Sélection</h4>
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 leading-relaxed max-w-[200px]">
                    Sélectionnez un jour ou une intervention pour voir les détails.
                  </p>
               </div>
             )}
           </div>
        </div>
      </div>

      {/* REFINED FLOATING MODAL (AS REQUESTED) */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/10 backdrop-blur-md animate-in fade-in duration-500">
          <div className="bg-white w-full max-w-xl rounded-[48px] shadow-diffused border border-white/10 relative overflow-hidden animate-in zoom-in-95 duration-500">
            
            {/* Header / Title */}
            <div className="px-12 pt-12 pb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tighter uppercase text-slate-900 leading-none">Nouvelle Mission</h2>
                <div className="h-1 w-8 bg-primary/20 rounded-full mt-4" />
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-4 hover:bg-slate-100 rounded-full transition-all text-slate-400"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="px-12 pb-12 space-y-8">
              
              {/* TITLE FIELD */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <StickyNote size={14} className="text-primary/40" />
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Objet de l'intervention</label>
                </div>
                <input 
                  type="text" 
                  autoFocus
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full h-16 bg-slate-50 border border-slate-100 focus:border-primary/20 rounded-[20px] px-6 outline-none font-black text-lg tracking-tight text-primary placeholder:opacity-20 transition-all uppercase" 
                  placeholder="EX: Pose Chaudière..."
                />
              </div>

              {/* DATES GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Clock size={14} className="text-primary/40" />
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Début Mission</label>
                  </div>
                  <input 
                    type="datetime-local" 
                    required
                    value={formData.start_time}
                    onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                    className="w-full h-14 bg-slate-50 border border-slate-100 focus:border-primary/20 rounded-[16px] px-5 outline-none font-bold text-sm text-primary transition-all" 
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Clock size={14} className="text-primary/40" />
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Fin Estimée</label>
                  </div>
                  <input 
                    type="datetime-local" 
                    required
                    value={formData.end_time}
                    onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                    className="w-full h-14 bg-slate-50 border border-slate-100 focus:border-primary/20 rounded-[16px] px-5 outline-none font-bold text-sm text-primary transition-all" 
                  />
                </div>
              </div>

              {/* DESCRIPTION */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <AlignLeft size={14} className="text-primary/40" />
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Instructions Techniques</label>
                </div>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full h-32 bg-slate-50 border border-slate-100 focus:border-primary/20 rounded-[20px] p-6 outline-none font-bold text-sm text-slate-600 resize-none transition-all" 
                  placeholder="Détails du chantier..."
                />
              </div>

              {/* ACTION BUTTONS (MATCHING IMAGE) */}
              <div className="flex items-center gap-8 pt-6 border-t border-slate-50">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-red-500 transition-colors px-4"
                >
                  Annuler
                </button>
                <Button 
                  type="submit"
                  className="flex-1 h-[72px] rounded-[24px] bg-[#00236F] hover:bg-[#001D5C] text-white font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-blue-900/20 gap-3"
                >
                  <UserPlus size={20} /> Programmer Mission
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
    <Suspense fallback={<div className="p-20 text-center font-black uppercase tracking-widest opacity-20">Initialisation de l'Agenda...</div>}>
      <CalendarContent />
    </Suspense>
  )
}
