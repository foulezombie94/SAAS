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
      setFormData({
        ...formData,
        start_time: val,
        end_time: addHours(newStart, 1).toISOString()
      })
    } else {
      setFormData({...formData, start_time: val})
    }
  }

  const handleEndTimeChange = (val: string) => {
    const newEnd = new Date(val)
    const currentStart = new Date(formData.start_time)
    if (isBefore(newEnd, currentStart)) {
      toast.error("La date de fin ne peut pas être avant le début")
      return
    }
    setFormData({...formData, end_time: val})
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isAfter(new Date(formData.start_time), new Date(formData.end_time))) {
      toast.error("Le début doit être avant la fin.")
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

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  })

  return (
    <div className="flex flex-col gap-10 pb-20 animate-in fade-in duration-700">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div>
          <h1 className="text-6xl font-black tracking-tighter text-primary uppercase leading-tight">Agenda <span className="text-slate-300">Pro</span></h1>
          <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px] mt-2 ml-1">Système de Planification</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="glass-card p-2 rounded-[24px] flex items-center gap-2 bg-white/40 backdrop-blur-md">
             <button onClick={() => setCurrentDate(addDays(currentDate, -30))} className="p-3"><ChevronLeft size={20} /></button>
             <span className="text-xs font-black uppercase tracking-[0.3em] min-w-[150px] text-center">{format(currentDate, 'MMMM yyyy', { locale: fr })}</span>
             <button onClick={() => setCurrentDate(addDays(currentDate, 30))} className="p-3"><ChevronRight size={20} /></button>
          </div>
          
          <Button 
            onClick={() => {
              setFormData({title:'', description:'', start_time: format(new Date(), "yyyy-MM-dd'T'09:00"), end_time: format(addHours(new Date(), 1), "yyyy-MM-dd'T'10:00"), client_id:'', quote_id:''})
              setShowModal(true)
            }}
            className="h-[72px] px-10 bg-primary text-white rounded-[24px] font-black uppercase tracking-[0.2em] text-[11px]"
          >
            Nouveau Chantier
          </Button>
        </div>
      </div>

      {/* CALENDAR GRID */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
        <div className="md:col-span-8 lg:col-span-9">
          <div className="glass-card rounded-[48px] overflow-hidden border border-white/40 bg-white/10 backdrop-blur-sm">
            <div className="grid grid-cols-7 bg-primary/5">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                <div key={day} className="py-6 text-center text-[10px] font-black text-primary/40 tracking-[0.4em] uppercase">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 auto-rows-[minmax(160px,auto)]">
              {daysInMonth.map((day: Date, i: number) => {
                const dayInterventions = interventions.filter(int => isSameDay(new Date(int.start_time), day))
                return (
                  <div key={i} className={`p-6 border-r border-b border-primary/5 min-h-[160px] ${!isSameMonth(day, currentDate) ? 'opacity-20' : ''}`}>
                    <span className={`text-2xl font-black ${isToday(day) ? 'text-primary' : 'text-slate-300'}`}>{format(day, 'd')}</span>
                    <div className="mt-4 space-y-2">
                      {dayInterventions.map((int, idx) => (
                        <div key={idx} onClick={() => setSelectedEvent(int)} className="p-3 bg-white rounded-xl text-[9px] font-black uppercase border border-slate-100 cursor-pointer hover:scale-105 transition-all shadow-sm">
                          {int.title}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="md:col-span-4 lg:col-span-3">
           {selectedEvent && (
             <div className="bg-slate-900 rounded-[40px] p-8 text-white shadow-3xl animate-in slide-in-from-right-10 duration-500">
                <div className="flex justify-between items-start mb-8">
                  <div className="p-3 bg-white/10 rounded-xl"><LayoutGrid size={24} /></div>
                  <button onClick={() => setSelectedEvent(null)}><X size={24} /></button>
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight mb-4">{selectedEvent.title}</h3>
                <p className="text-[10px] font-bold text-white/40 uppercase mb-8">{format(new Date(selectedEvent.start_time), "HH:mm")} - {format(new Date(selectedEvent.end_time), "HH:mm")}</p>
                <div className="space-y-3">
                   <Button onClick={() => handleStatusChange(selectedEvent.id, 'completed')} className="w-full h-14 bg-emerald-500 border-none font-black uppercase text-[10px] rounded-xl">Terminer Mission</Button>
                   <Button variant="outline" className="w-full h-14 bg-white text-slate-900 font-black uppercase text-[10px] rounded-xl">Envoyer Rappel</Button>
                </div>
             </div>
           )}
        </div>
      </div>

      {/* FLOATING MODAL WITH STRICT ANCHORING */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/10 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl border border-white/20 relative animate-in zoom-in-95 duration-300">
            <div className="p-10 flex items-center justify-between">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Programmation</h2>
              <button onClick={() => { setShowModal(false); setPickerType(null); }} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleCreate} className="px-10 pb-10 space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Objet de l'intervention</label>
                <input 
                  type="text" autoFocus required value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full h-14 bg-slate-50 border border-slate-100 rounded-xl px-6 outline-none font-black text-primary uppercase" 
                  placeholder="EX: Pose Chaudière..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* START TIME COLUMN */}
                <div className="relative">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Début</label>
                  <button 
                    type="button" onClick={() => setPickerType(pickerType === 'start' ? null : 'start')}
                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-xl px-5 flex items-center justify-between font-bold text-sm text-primary"
                  >
                    {format(new Date(formData.start_time), "d MMM HH:mm", {locale: fr})}
                    <Clock size={16} className="text-slate-300" />
                  </button>

                  {pickerType === 'start' && (
                    <div className="absolute top-[calc(100%+8px)] left-0 z-[120]">
                      <DateTimePicker 
                        value={formData.start_time}
                        onChange={handleStartTimeChange}
                        onClose={() => setPickerType(null)}
                      />
                    </div>
                  )}
                </div>

                {/* END TIME COLUMN */}
                <div className="relative">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Fin</label>
                  <button 
                    type="button" onClick={() => setPickerType(pickerType === 'end' ? null : 'end')}
                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-xl px-5 flex items-center justify-between font-bold text-sm text-primary"
                  >
                    {format(new Date(formData.end_time), "d MMM HH:mm", {locale: fr})}
                    <Clock size={16} className="text-slate-300" />
                  </button>

                  {pickerType === 'end' && (
                    <div className="absolute top-[calc(100%+8px)] right-0 z-[120]">
                      <DateTimePicker 
                        value={formData.end_time}
                        onChange={handleEndTimeChange}
                        onClose={() => setPickerType(null)}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6 pt-6 border-t border-slate-50">
                <Button type="submit" className="flex-1 h-[64px] rounded-2xl bg-[#00236F] text-white font-black uppercase tracking-widest text-[10px] shadow-lg">Enregistrer Mission</Button>
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
