'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Paperclip, Sparkles, ExternalLink, Calendar, User, FileText, CheckCircle2 } from 'lucide-react'

// ─── Types ───────────────────────────────────────
interface Message {
  id: string
  role: 'user' | 'agent'
  text: string
  time: string
  file?: { name: string; size: string }
  isMarkdown?: boolean
}

// ─── Helpers ─────────────────────────────────────
function nowLabel() {
  return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}
function todayLabel() {
  return new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

/** Minimal markdown → JSX: bold (**text**), links ([text](type:id)) and newlines */
function renderMarkdown(text: string, onLinkClick: (type: string, id: string) => void) {
  return text.split('\n').map((line, i) => {
    // 1. Detect links [Text](type:id)
    const parts = line.split(/(\[.+?\]\(.+?\))/g)
    
    return (
      <span key={i}>
        {parts.map((part, j) => {
          const linkMatch = part.match(/\[(.+?)\]\((.+?):(.+?)\)/)
          if (linkMatch) {
            const [, label, type, id] = linkMatch
            return (
              <button
                key={j}
                onClick={() => onLinkClick(type, id)}
                className="text-amber-500 font-bold hover:underline inline-flex items-center gap-1 mx-1"
              >
                {label}
                <ExternalLink size={12} />
              </button>
            )
          }

          // 2. Detect bold **text**
          const boldParts = part.split(/\*\*(.+?)\*\*/g)
          return boldParts.map((bp, k) => 
            k % 2 === 1 ? <strong key={k}>{bp}</strong> : bp
          )
        })}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    )
  })
}

// ─── Component ───────────────────────────────────
export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [started, setStarted] = useState(false)
  
  // Side Panel State
  const [selectedItem, setSelectedItem] = useState<{ type: string; id: string; data?: any } | null>(null)
  const [loadingItem, setLoadingItem] = useState(false)

  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLTextAreaElement>(null)
  const fileRef    = useRef<HTMLInputElement>(null)

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  // Close on Escape
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [])

  // Greeting on first open (no DB call)
  useEffect(() => {
    if (open && !started) {
      setStarted(true)
      setTyping(true)
      setTimeout(() => {
        pushAgent(
          "Bonjour 👋 Je suis votre assistant ArtisanFlow. Je peux rechercher vos **devis** et **factures** par numéro, nom de client ou **date**.\n\nExemples :\n• *devis #42* ou juste *42*\n• *devis de Dupont*\n• *devis du 23/04*",
          true
        )
        setTyping(false)
      }, 900)
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 300)
  }, [open, started]) // eslint-disable-line react-hooks/exhaustive-deps

  function pushAgent(text: string, isMarkdown = false) {
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role: 'agent',
      text,
      time: nowLabel(),
      isMarkdown,
    }])
  }

  // ── Send message → API ────────────────────────
  const sendMessage = useCallback(async (text = input.trim(), file?: { name: string; size: string }) => {
    if (!text && !file) return

    // Optimistic user bubble
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role: 'user',
      text,
      time: nowLabel(),
      file,
    }])
    setInput('')
    setTyping(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        pushAgent(err?.reply ?? "⚠️ Une erreur est survenue. Veuillez réessayer.", true)
        return
      }

      const { reply } = await res.json()
      pushAgent(reply, true)
    } catch {
      pushAgent("⚠️ Impossible de joindre le serveur. Vérifiez votre connexion.", true)
    } finally {
      setTyping(false)
    }
  }, [input])

  const handleLinkClick = async (type: string, id: string) => {
    setLoadingItem(true)
    setSelectedItem({ type, id })
    
    try {
      const res = await fetch(`/api/chat/preview?type=${type}&id=${id}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedItem({ type, id, data })
      }
    } catch (err) {
      console.error('Error fetching preview:', err)
    } finally {
      setLoadingItem(false)
    }
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const size = f.size > 1024 * 1024
      ? `${(f.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(f.size / 1024)} KB`
    sendMessage(`J'ai joint un fichier : ${f.name}`, { name: f.name, size })
    e.target.value = ''
  }

  // ── Render ────────────────────────────────────
  return (
    <>
      {/* ── Floating Button ── */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        aria-label="Ouvrir le support"
        className="fixed bottom-6 right-6 z-[100] w-14 h-14 rounded-2xl bg-gradient-to-br from-[#001142] to-[#00236f] flex items-center justify-center border border-white/10"
        style={{ boxShadow: '0 8px 32px rgba(0,35,111,0.38)' }}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }}>
              <X size={22} className="text-white" />
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.18 }}>
              <MessageCircle size={22} className="text-white" />
            </motion.div>
          )}
        </AnimatePresence>
        {!open && <span className="absolute inset-0 rounded-2xl animate-ping bg-white/15 pointer-events-none" />}
      </motion.button>

      {/* ── Modal centré ── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[98] bg-black/30 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              key="chat-modal"
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              className="fixed inset-0 z-[99] flex items-center justify-center pointer-events-none"
            >
              <div
                className="pointer-events-auto w-full max-w-2xl mx-4 flex flex-col rounded-3xl overflow-hidden border border-slate-200/60"
                style={{
                  height: 'min(680px, 90vh)',
                  boxShadow: '0 32px 80px rgba(0,17,66,0.22), 0 0 0 1px rgba(0,35,111,0.06)',
                  background: '#faf8ff',
                }}
              >
                {/* Header */}
                <div className="bg-gradient-to-br from-[#001142] to-[#00236f] px-6 py-5 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                        <Sparkles size={20} className="text-white" />
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#001142] rounded-full" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.18em]">Assistant intelligent</p>
                      <p className="text-[15px] font-bold text-white leading-tight">ArtisanFlow Support</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <X size={16} className="text-white" />
                  </button>
                </div>

                {/* Date separator */}
                <div className="flex justify-center pt-5 shrink-0">
                  <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-4 py-1.5 rounded-full capitalize">
                    {todayLabel()}
                  </span>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 font-['Inter']" style={{ scrollbarWidth: 'thin' }}>
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse ml-auto' : ''} max-w-[85%]`}
                    >
                      {/* Agent avatar */}
                      {msg.role === 'agent' && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#001142] to-[#00236f] flex items-center justify-center shrink-0 self-end mb-1">
                          <Sparkles size={13} className="text-white" />
                        </div>
                      )}

                      <div className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : ''}`}>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {msg.role === 'user' ? 'Vous' : 'Support'}
                        </span>

                        {/* Bubble */}
                        {msg.text && (
                          <div className={`px-4 py-3 rounded-2xl text-[13px] leading-relaxed shadow-sm font-['Inter'] ${
                            msg.role === 'user'
                              ? 'bg-[#001142] text-white rounded-br-sm'
                              : 'bg-white border border-slate-100 text-slate-700 rounded-bl-sm'
                          }`}>
                            {msg.isMarkdown ? renderMarkdown(msg.text, handleLinkClick) : msg.text}
                            <p className={`text-[9px] mt-2 font-bold ${msg.role === 'user' ? 'text-white/40 text-right' : 'text-slate-300'}`}>
                              {msg.time}
                            </p>
                          </div>
                        )}

                        {/* File attachment */}
                        {msg.file && (
                          <div className="mt-1 bg-blue-50/60 border border-blue-100 p-2.5 rounded-xl flex items-center gap-3">
                            <div className="w-9 h-9 bg-[#00236f] text-white rounded-lg flex items-center justify-center shrink-0">
                              <Paperclip size={14} />
                            </div>
                            <div>
                              <p className="text-[12px] font-bold text-[#001142]">{msg.file.name}</p>
                              <p className="text-[10px] text-slate-400">{msg.file.size}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Typing dots */}
                  {typing && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#001142] to-[#00236f] flex items-center justify-center shrink-0 self-end mb-1">
                        <Sparkles size={13} className="text-white" />
                      </div>
                      <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
                        {[0, 0.15, 0.3].map((delay, i) => (
                          <motion.span
                            key={i}
                            className="w-2 h-2 rounded-full bg-slate-300"
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Input bar */}
                <div className="px-6 pb-6 pt-3 bg-[#faf8ff] border-t border-slate-100 shrink-0 font-['Inter']">
                  <div className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-col shadow-sm focus-within:border-[#001142]/30 focus-within:shadow-md transition-all">
                    <textarea
                      ref={inputRef}
                      rows={2}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          sendMessage()
                        }
                      }}
                      placeholder='Tapez votre message… ex: "42", "devis de Martin" ou "devis du 23/04"'
                      className="w-full bg-transparent border-none focus:ring-0 resize-none text-[13px] text-slate-700 placeholder:text-slate-400 leading-relaxed font-['Inter']"
                    />
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-1">
                      <button
                        onClick={() => fileRef.current?.click()}
                        className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
                        title="Joindre un fichier"
                      >
                        <Paperclip size={17} />
                      </button>
                      <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={() => sendMessage()}
                        disabled={!input.trim() || typing}
                        className="bg-amber-400 hover:bg-amber-300 disabled:opacity-30 disabled:cursor-not-allowed text-[#001142] font-black text-[12px] uppercase tracking-wider px-5 py-2 rounded-xl flex items-center gap-2 transition-colors"
                      >
                        Envoyer
                        <Send size={14} />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Side Details Panel ── */}
              <AnimatePresence>
                {selectedItem && (
                  <motion.div
                    initial={{ x: 40, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 40, opacity: 0 }}
                    className="pointer-events-auto ml-6 w-[400px] bg-white rounded-3xl overflow-hidden border border-slate-200/60 shadow-2xl flex flex-col font-['Inter']"
                    style={{ height: 'min(680px, 90vh)' }}
                  >
                    <div className="bg-slate-50 border-b border-slate-100 p-6 flex items-center justify-between">
                      <h3 className="font-black text-[10px] text-primary uppercase tracking-[0.2em]">Détails du document</h3>
                      <button 
                        onClick={() => setSelectedItem(null)}
                        className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-8">
                      {loadingItem ? (
                        <div className="h-full flex items-center justify-center">
                          <div className="w-8 h-8 border-4 border-primary border-t-transparent animate-spin rounded-full" />
                        </div>
                      ) : selectedItem.data ? (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                              {selectedItem.type === 'quote' ? <FileText size={28} /> : <CheckCircle2 size={28} />}
                            </div>
                            <div>
                              <h4 className="text-xl font-black text-primary">
                                {selectedItem.type === 'quote' ? 'Devis' : 'Facture'} #{selectedItem.data.number}
                              </h4>
                              <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md uppercase tracking-wider">
                                {selectedItem.data.status}
                              </span>
                            </div>
                          </div>

                          <div className="grid gap-6">
                            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Informations Client</p>
                              <div className="flex items-center gap-3 mb-2">
                                <User size={16} className="text-primary/40" />
                                <span className="text-sm font-bold text-slate-700">{selectedItem.data.clients?.name}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <Calendar size={16} className="text-primary/40" />
                                <span className="text-sm font-medium text-slate-500">Créé le {new Date(selectedItem.data.created_at).toLocaleDateString('fr-FR')}</span>
                              </div>
                            </div>

                            <div className="bg-[#001142] p-6 rounded-2xl text-white shadow-xl shadow-primary/10">
                              <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-2 text-center">Montant Total</p>
                              <p className="text-3xl font-black text-center tabular-nums">
                                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(selectedItem.data.total_ttc)}
                              </p>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-slate-100">
                             <a 
                               href={`/dashboard/${selectedItem.type === 'quote' ? 'quotes' : 'invoices'}/${selectedItem.id}`}
                               className="w-full h-14 bg-slate-50 hover:bg-slate-100 border border-slate-100 flex items-center justify-center gap-2 rounded-2xl text-[12px] font-black text-primary uppercase tracking-widest transition-all"
                             >
                               Voir la page complète
                               <ExternalLink size={14} />
                             </a>
                          </div>
                        </div>
                      ) : (
                        <p className="text-center text-slate-400 py-12">Données indisponibles.</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
