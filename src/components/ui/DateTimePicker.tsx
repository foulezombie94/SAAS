'use client'

import React, { useState, useEffect } from 'react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, startOfWeek, endOfWeek, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, Check } from 'lucide-react'
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
  const [timeValue, setTimeValue] = useState(format(initialDate, 'HH:mm'))

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
    const isoString = newDate.toISOString()
    onChange(isoString)
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setTimeValue(val)
    
    // Only update the actual date if it's a valid complete time (HH:mm)
    const parts = val.split(':')
    if (parts.length === 2) {
      const h = parseInt(parts[0])
      const m = parseInt(parts[1])
      if (h >= 0 && h < 24 && m >= 0 && m < 60) {
        const newDate = new Date(selectedDate)
        newDate.setHours(h)
        newDate.setMinutes(m)
        setSelectedDate(newDate)
        onChange(newDate.toISOString())
      }
    }
  }

  return (
    <div className="bg-white rounded-[32px] shadow-diffused border border-slate-100 overflow-hidden flex flex-col w-[340px] animate-in zoom-in-95 duration-300">
      
      {/* CALENDAR SECTION */}
      <div className="p-6 border-b border-slate-50">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            {format(currentMonth, 'MMMM yyyy', { locale: fr })}
          </h4>
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentMonth(subMonths(currentMonth, 1)); }} 
              className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-[#00236F] transition-all border border-slate-100"
            >
              <ChevronLeft size={16} strokeWidth={3} />
            </button>
            <button 
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentMonth(addMonths(currentMonth, 1)); }} 
              className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-[#00236F] transition-all border border-slate-100"
            >
              <ChevronRight size={16} strokeWidth={3} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {['lu', 'ma', 'me', 'je', 've', 'sa', 'di'].map(d => (
            <div key={d} className="text-center text-[9px] font-black uppercase text-slate-200 py-1">{d}</div>
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
                  "h-9 w-9 rounded-xl flex items-center justify-center text-[11px] font-bold transition-all",
                  !isCurrentMonth && "text-slate-100",
                  isCurrentMonth && !isSelected && "text-slate-500 hover:bg-slate-50",
                  isSelected && "bg-[#00236F] text-white shadow-lg shadow-blue-900/20"
                )}
              >
                {format(day, 'd')}
              </button>
            )
          })}
        </div>
      </div>

      {/* TIME INPUT SECTION (DIRECT ENTRY) */}
      <div className="p-6 bg-slate-50/50 flex flex-col gap-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Clock size={12} className="text-primary/40" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">HEURE MISSION</span>
            </div>
            <input 
                type="time" 
                value={timeValue}
                onChange={handleTimeChange}
                className="bg-transparent border-none outline-none font-black text-xl text-[#00236F] w-[140px] text-right pr-2"
            />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button 
            type="button"
            onClick={() => {
                const now = new Date()
                setSelectedDate(now)
                handleDateSelect(now)
                setTimeValue(format(now, 'HH:mm'))
            }}
            className="text-[9px] font-black uppercase tracking-[0.1em] text-primary hover:text-[#00236F] transition-colors"
          >
            Aujourd'hui
          </button>
          <button 
            type="button"
            onClick={onClose}
            className="h-10 px-6 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2"
          >
            Confirmer <Check size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}
