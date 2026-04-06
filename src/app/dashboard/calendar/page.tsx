'use client'

import React, { useState, useEffect, Suspense, useRef } from 'react'
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
  X,
  CalendarDays as DateIcon
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { createIntervention, getInterventions, deleteIntervention, updateInterventionStatus, sendInterventionReminder } from './actions'
import { toast } from 'sonner'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addDays, isToday, isSameMonth, addHours, isAfter, isBefore } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useSearchParams, useRouter } from 'next/navigation'
import { DateTimePicker } from '@/components/ui/DateTimePicker'

function CalendarContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [interventions, setInterventions] = useState<any[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showModal, setShowModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Custom Picker State
  const [pickerType, setPickerType] = useState<'start' | 'end' | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: format(new Date(), "yyyy-MM-dd'T'09:00"),
    end_time: format(addHours(new Date(), 1), "yyyy-MM-dd'T'10:00"),
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
        end_time: format(addHours(new Date(), 2), "yyyy-MM-dd'T'11:00")
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

  const handleStartTimeChange = (val: string) => {
    const newStart = new Date(val)
    const currentEnd = new Date(formData.end_time)
    if (isAfter(newStart, currentEnd)) {
      setFormData({ ...formData, start_time: val, end_time: addHours(newStart, 1).toISOString() })
    } else {
      setFormData({ ...formData, start_time: val })
    }
  }

  const handleEndTimeChange = (val: string) => {
    const newEnd = new Date(val)
    const currentStart = new Date(formData.start_time)
    if (isBefore(newEnd, currentStart)) {
      toast.error("La date de fin ne peut pas être avant le début")
      return
    }
    setFormData({ ...formData, end_time: val })
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isAfter(new Date(formData.start_time), new Date(formData.end_time))) {
      toast.error("Le début doit être avant la fin.")
      return
    }
    const res = await createIntervention(formData)
    if (res.error) toast.error(res.error)
    else {
      toast.success('Rendez-vous planifié !')
      setShowModal(false)
      fetchInterventions()
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    const res = await updateInterventionStatus(id, status)
    if (res.error) toast.error(res.error)
    else {
      if (status === 'completed') {
        toast.success('Intervention terminée !', {
          action: res.data?.quote_id ? { label: "Facturer", onClick: () => router.push(`/dashboard/quotes/${res.data.quote_id}`) } : undefined
        })
      }
      setSelectedEvent(null)
      fetchInterventions()
    }
  }

  const handleSendReminder = async (id: string) => {
    const toastId = toast.loading("Envoi du rappel...")
    const res = await sendInterventionReminder(id)
    if (res.error) toast.error(res.error, { id: toastId })
    else {
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
      
      {/* HEADER ELITE SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="px-3 py-1 bg-primary/5 border border-primary/10 rounded-full flex items-center gap-2">
               <Zap size={12} className="text-primary" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Status: LIVE</span>
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
          <div className="glass-card p-2 rounded-[24px] flex items-center gap-2 bg-white/40 backdrop-blur-md shadow-sm border border-white">
             <button onClick={() => setCurrentDate(addDays(currentDate, -30))} className="p-3 hover:bg-white rounded-xl transition-all"><ChevronLeft size={20} /></button>
             <span className="text-xs font-black uppercase tracking-[0.3em] min-w-[150px] text-center">{format(currentDate, 'MMMM yyyy', { locale: fr })}</span>
             <button onClick={() => setCurrentDate(addDays(currentDate, 30))} className="p-3 hover:bg-white rounded-xl transition-all"><ChevronRight size={20} /></button>
          </div>
          
          <Button 
            onClick={() => {
              setFormData({title:'', description:'', start_time: format(new Date(), "yyyy-MM-dd'T'09:00"), end_time: format(addHours(new Date(), 1), "yyyy-MM-dd'T'10:00"), client_id:'', quote_id:''})
              setShowModal(true)
            }}
            className="group h-[72px] px-10 bg-primary text-white rounded-[24px] shadow-2xl flex items-center gap-4 hover:scale-[1.02] transition-all overflow-hidden relative"
          >
            <Plus size={24} />
            <span className="font-black uppercase tracking-[0.2em] text-[11px]">Programmer Intervention</span>
          </Button>
        </div>
      </div>

      {/* CORE GRID & SIDEBAR */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
        
        {/* GRID SECTION */}
        <div className="md:col-span-8 lg:col-span-9">
          <div className="glass-card rounded-[48px] overflow-hidden border border-white/40 bg-white/10 backdrop-blur-sm shadow-xl">
            <div className="grid grid-cols-7 border-b border-primary/5 bg-primary/5">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                <div key={day} className="py-8 text-center text-[10px] font-black text-primary/40 tracking-[0.4em] uppercase">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 auto-rows-[minmax(180px,auto)] bg-white/20">
              {daysInMonth.map((day: Date, i: number) => {
                const dayInterventions = interventions.filter(int => isSameDay(new Date(int.start_time), day))
                const active = isToday(day)
                
                return (
                  <div key={i} className={`p-6 border-r border-b border-primary/5 transition-all hover:bg-primary/[0.02] min-h-[180px] ${!isSameMonth(day, currentDate) ? 'opacity-20' : ''}`}>
                    <div className="flex justify-between items-start">
                      <span className={`text-2xl font-black transition-all ${active ? 'text-primary' : 'text-slate-300'}`}>{format(day, 'd')}</span>
                      {active && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                    </div>
                    
                    <div className="mt-6 space-y-3">
                      {dayInterventions.map((int, idx) => (
                        <div key={idx} onClick={() => setSelectedEvent(int)} className={`group/item p-4 rounded-[20px] text-[10px] font-black cursor-pointer hover:scale-105 transition-all shadow-xl border border-white uppercase tracking-tighter ${int.status === 'completed' ? 'bg-slate-900 text-white/50 border-slate-800' : 'bg-white text-primary'}`}>
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${int.status === 'completed' ? 'bg-emerald-500/30' : 'bg-primary'}`} />
                          <div className="truncate px-1 mb-2">{int.title}</div>
                          <div className="flex items-center gap-2 text-[8px] font-bold opacity-40 px-1"><Clock size={12} /> {format(new Date(int.start_time), 'HH:mm')}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* SIDEBAR ELITE */}
        <div className="md:col-span-4 lg:col-span-3">
           <div className="sticky top-10 space-y-8">
             {selectedEvent ? (
               <div className="bg-slate-900 rounded-[48px] p-10 text-white shadow-3xl border border-white/10 animate-in slide-in-from-right-10 duration-500 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-5"><Zap size={200} /></div>
                  
                  <div className="flex justify-between items-start mb-10 relative z-10">
                    <div className="p-4 bg-white/10 rounded-2xl"><LayoutGrid size={28} className="text-white" /></div>
                    <button onClick={() => setSelectedEvent(null)} className="p-3 hover:bg-white/10 rounded-full transition-all group"><X size={24} /></button>
                  </div>
                  
                  <div className="relative z-10 mb-10">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] mb-4">CODE M1SSION: {selectedEvent.id.split('-')[0]}</p>
                    <h3 className="text-3xl font-black tracking-tighter uppercase leading-tight mb-4">{selectedEvent.title}</h3>
                    <div className={`inline-flex px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${selectedEvent.status === 'completed' ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' : 'border-white/20 text-white/40'}`}>{selectedEvent.status === 'completed' ? 'Exécuté' : 'À Planifier'}</div>
                  </div>

                  <div className="space-y-6 mb-12 relative z-10">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center"><Clock size={18} className="text-white/40" /></div>
                        <div>
                          <p className="text-[9px] font-black uppercase text-white/30 tracking-widest leading-none mb-1">HORAIRE</p>
                          <p className="text-sm font-black uppercase">{format(new Date(selectedEvent.start_time), "HH:mm")} - {format(new Date(selectedEvent.end_time), "HH:mm")}</p>
                        </div>
                     </div>
                     {selectedEvent.description && (
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0"><AlignLeft size={18} className="text-white/40" /></div>
                          <div>
                            <p className="text-[9px] font-black uppercase text-white/30 tracking-widest leading-none mb-2">DESCRIPTION</p>
                            <p className="text-xs font-bold leading-relaxed text-white/60">{selectedEvent.description}</p>
                          </div>
                        </div>
                     )}
                  </div>

                  <div className="flex flex-col gap-4 relative z-10">
                     {selectedEvent.status !== 'completed' && (
                       <Button onClick={() => handleStatusChange(selectedEvent.id, 'completed')} className="h-[72px] bg-emerald-500 hover:bg-emerald-600 font-black uppercase text-[10px] w-full gap-3 rounded-2xl shadow-xl shadow-emerald-900/40 border-none"><CheckCircle2 size={20} /> Valider l'Exécution</Button>
                     )}
                     <Button onClick={() => handleSendReminder(selectedEvent.id)} variant="outline" className="h-[72px] border-white/10 hover:bg-white text-slate-900 font-black uppercase text-[10px] w-full gap-3 rounded-2xl"><Mail size={20} /> Rappel SMS/Email</Button>
                     <button onClick={() => { if(confirm("Supprimer cette mission ?")) { deleteIntervention(selectedEvent.id).then(() => { fetchInterventions(); setSelectedEvent(null); }) } }} className="text-[10px] font-black uppercase text-red-500/60 mt-6 hover:text-red-500 flex items-center justify-center gap-2 transition-colors py-4"><Trash2 size={14} /> Annuler la mission</button>
                  </div>
               </div>
             ) : (
               <div className="glass-card rounded-[48px] p-12 border border-white flex flex-col items-center text-center justify-center min-h-[500px] bg-white/40 backdrop-blur-md shadow-xl">
                  <div className="w-24 h-24 rounded-full bg-primary/5 flex items-center justify-center mb-10"><CalendarDays size={32} className="text-primary/20" /></div>
                  <h4 className="text-xs font-black uppercase tracking-[0.4em] text-primary mb-4 opacity-40">Sélection Mission</h4>
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 leading-relaxed max-w-[200px]">Sélectionnez un jour ou une intervention pour voir les détails.</p>
               </div>
             )}
           </div>
        </div>
      </div>

      {/* MODAL WITH STRICT ANCHORING AND DIRECT PICKER */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/10 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-[48px] shadow-2xl border border-white relative animate-in zoom-in-95 duration-300">
            <div className="p-12 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 leading-none">Nouvelle Mission</h2>
                <div className="h-1 w-8 bg-primary/20 rounded-full mt-4" />
              </div>
              <button onClick={() => { setShowModal(false); setPickerType(null); }} className="p-4 hover:bg-slate-100 rounded-full transition-all text-slate-400"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleCreate} className="px-12 pb-12 space-y-8">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <StickyNote size={14} className="text-primary/40" />
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Objet du chantier</label>
                </div>
                <input 
                  type="text" autoFocus required value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full h-16 bg-slate-50 border border-slate-100 focus:border-primary/20 rounded-[20px] px-6 outline-none font-black text-lg tracking-tight text-primary placeholder:opacity-20 transition-all uppercase" 
                  placeholder="EX: Installation Pompe..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* START TIME COLUMN - ALIGN LEFT */}
                <div className="relative space-y-3 w-full flex flex-col items-start">
                  <div className="flex items-center gap-3">
                    <DateIcon size={14} className="text-primary/40" />
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Début Mission</label>
                  </div>
                  <button 
                    type="button" onClick={() => setPickerType(pickerType === 'start' ? null : 'start')}
                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-[16px] px-5 flex items-center justify-between font-bold text-sm text-primary transition-all group"
                  >
                    <span>{format(new Date(formData.start_time), "d MMM HH:mm", {locale: fr})}</span>
                    <Clock size={16} className="text-slate-300 group-hover:text-primary transition-colors" />
                  </button>

                  {pickerType === 'start' && (
                    <div className="absolute top-[calc(100%+8px)] left-0 z-[120] animate-in slide-in-from-top-2 duration-300 pointer-events-auto">
                      <DateTimePicker 
                        value={formData.start_time}
                        onChange={handleStartTimeChange}
                        onClose={() => setPickerType(null)}
                      />
                    </div>
                  )}
                </div>

                {/* END TIME COLUMN - ALIGN RIGHT */}
                <div className="relative space-y-3 w-full flex flex-col items-end">
                  <div className="flex items-center gap-3 w-full">
                    <DateIcon size={14} className="text-primary/40" />
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Fin Estimée</label>
                  </div>
                  <button 
                    type="button" onClick={() => setPickerType(pickerType === 'end' ? null : 'end')}
                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-[16px] px-5 flex items-center justify-between font-bold text-sm text-primary transition-all group"
                  >
                    <span>{format(new Date(formData.end_time), "d MMM HH:mm", {locale: fr})}</span>
                    <Clock size={16} className="text-slate-300 group-hover:text-primary transition-colors" />
                  </button>

                  {pickerType === 'end' && (
                    <div className="absolute top-[calc(100%+8px)] right-0 z-[120] animate-in slide-in-from-top-2 duration-300 pointer-events-auto">
                      <DateTimePicker 
                        value={formData.end_time}
                        onChange={handleEndTimeChange}
                        onClose={() => setPickerType(null)}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <AlignLeft size={14} className="text-primary/40" />
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Notes Techniques</label>
                </div>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full h-32 bg-slate-50 border border-slate-100 focus:border-primary/20 rounded-[20px] p-6 outline-none font-bold text-sm text-slate-600 resize-none transition-all" 
                  placeholder="Détails importants..."
                />
              </div>

              <div className="flex items-center gap-8 pt-6 border-t border-slate-50">
                <Button type="submit" className="flex-1 h-[72px] rounded-[24px] bg-[#00236F] hover:bg-[#001D5C] text-white font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-blue-900/20 gap-3"><UserPlus size={20} /> Programmer Mission</Button>
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
    <Suspense fallback={null}>
      <CalendarContent />
    </Suspense>
  )
}
