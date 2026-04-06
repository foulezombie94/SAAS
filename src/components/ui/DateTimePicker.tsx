'use client'

import React, { useState, useEffect } from 'react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, startOfWeek, endOfWeek, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface DateTimePickerProps {
  value: string // ISO string
  onChange: (value: string) => void
  onClose: () => void
}

export function DateTimePicker({ value, onChange, onClose }: DateTimePickerProps) {
  const initialDate = value ? new Date(value) : new Date()
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(initialDate))
  const [selectedDate, setSelectedDate] = useState(initialDate)
  
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
  const minutes = ['00', '15', '30', '45']

  const selectedHour = selectedDate.getHours().toString().padStart(2, '0')
  const selectedMinute = (Math.round(selectedDate.getMinutes() / 15) * 15 % 60).toString().padStart(2, '0')

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 })
  })

  const handleDateSelect = (day: Date) => {
    const newDate = new Date(selectedDate)
    newDate.setFullYear(day.getFullYear())
    newDate.setMonth(day.getMonth())
    newDate.setDate(day.getDate())
    setSelectedDate(newDate)
    onChange(newDate.toISOString())
  }

  const handleTimeSelect = (type: 'h' | 'm', val: string) => {
    const newDate = new Date(selectedDate)
    if (type === 'h') newDate.setHours(parseInt(val))
    if (type === 'm') newDate.setMinutes(parseInt(val))
    setSelectedDate(newDate)
    onChange(newDate.toISOString())
  }

  return (
    <div className="bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col md:flex-row w-[480px] animate-in zoom-in-95 duration-300">
      
      {/* CALENDAR SECTION (2/3) */}
      <div className="p-8 border-r border-slate-50 flex-1">
        <div className="flex items-center justify-between mb-8">
          <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">
            {format(currentMonth, 'MMMM yyyy', { locale: fr })}
          </h4>
          <div className="flex gap-2">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-4">
          {['lu', 'ma', 'me', 'je', 've', 'sa', 'di'].map(d => (
            <div key={d} className="text-center text-[10px] font-black uppercase text-slate-300 py-2">{d}</div>
          ))}
          {days.map((day, i) => {
            const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
            const isSelected = isSameDay(day, selectedDate)
            
            return (
              <button
                key={i}
                type="button"
                onClick={() => handleDateSelect(day)}
                className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all",
                  !isCurrentMonth && "text-slate-200",
                  isCurrentMonth && !isSelected && "text-slate-600 hover:bg-slate-50",
                  isSelected && "bg-[#00236F] text-white shadow-lg shadow-blue-900/20"
                )}
              >
                {format(day, 'd')}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-4 pt-6 border-t border-slate-50 mt-4">
          <button 
            type="button"
            onClick={() => handleDateSelect(new Date())}
            className="text-[10px] font-black uppercase tracking-[0.1em] text-primary hover:underline"
          >
            Aujourd'hui
          </button>
          <button 
            type="button"
            onClick={onClose}
            className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 hover:text-slate-600 ml-auto"
          >
            Fermer
          </button>
        </div>
      </div>

      {/* TIME SECTION (1/3) */}
      <div className="bg-slate-50/50 w-[140px] flex border-l border-slate-100 relative">
         {/* HOURS */}
         <div className="flex-1 flex flex-col overflow-y-auto max-h-[380px] scrollbar-hide py-4 border-r border-slate-100">
            {hours.map(h => (
              <button
                key={h}
                type="button"
                onClick={() => handleTimeSelect('h', h)}
                className={cn(
                  "py-3 text-sm font-black transition-all",
                  selectedHour === h ? "bg-[#00236F] text-white" : "text-slate-400 hover:bg-white"
                )}
              >
                {h}
              </button>
            ))}
         </div>
         {/* MINUTES */}
         <div className="flex-1 flex flex-col overflow-y-auto max-h-[380px] scrollbar-hide py-4">
            {minutes.map(m => (
              <button
                key={m}
                type="button"
                onClick={() => handleTimeSelect('m', m)}
                className={cn(
                  "py-3 text-sm font-black transition-all",
                  selectedMinute === m ? "bg-[#00236F] text-white" : "text-slate-400 hover:bg-white"
                )}
              >
                {m}
              </button>
            ))}
         </div>
      </div>
    </div>
  )
}
