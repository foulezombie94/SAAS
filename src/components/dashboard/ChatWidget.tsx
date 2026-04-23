'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, CheckCircle2, User, Calendar } from 'lucide-react'

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
                className="text-on-tertiary-container font-bold hover:underline inline-flex items-center gap-1 mx-1"
              >
                {label}
                <span className="material-symbols-outlined" style={{ fontSize: '12px', marginLeft: '2px' }}>open_in_new</span>
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
        className="fixed bottom-6 right-6 z-[100] w-14 h-14 rounded-2xl bg-primary flex items-center justify-center border border-white/10 shadow-[0_8px_32px_rgba(0,35,111,0.38)]"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="close" className="material-symbols-outlined text-white" style={{ fontSize: '24px' }}>close</motion.span>
          ) : (
            <motion.span key="chat" className="material-symbols-outlined text-white" style={{ fontSize: '24px' }}>auto_awesome</motion.span>
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
              className="fixed inset-0 z-[98] bg-slate-900/40 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              key="chat-modal"
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              className="fixed inset-0 z-[99] flex items-center justify-center pointer-events-none p-4 sm:p-6"
            >
              <div
                className="pointer-events-auto w-full max-w-2xl bg-surface flex flex-col relative rounded-3xl shadow-[0_20px_50px_rgba(0,17,66,0.3)] overflow-hidden"
                style={{ height: '85vh', maxHeight: '800px' }}
              >
                {/* Background Glow */}
                <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-gradient-to-br from-primary-fixed-dim/20 to-transparent rounded-full blur-3xl -z-10 pointer-events-none translate-x-1/2 -translate-y-1/2" />

                {/* Header */}
                <header className="bg-primary px-6 py-5 flex items-center justify-between z-10 shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="relative w-12 h-12 flex items-center justify-center rounded-xl bg-white/10 border border-white/5 shadow-sm">
                      <span className="material-symbols-outlined text-white" style={{ fontSize: '24px' }}>auto_awesome</span>
                      <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-400 border-2 border-primary rounded-full" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-inverse-primary uppercase tracking-widest mb-0.5">Assistant Intelligent</span>
                      <h2 className="font-bold text-lg text-white leading-tight font-headline">ArtisanFlow Support</h2>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setOpen(false)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
                  </button>
                </header>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-6 relative z-10 font-body" style={{ scrollbarWidth: 'thin' }}>
                  {/* Date separator */}
                  <div className="text-center">
                    <span className="text-[11px] font-bold text-on-surface-variant bg-surface-container-high px-4 py-1.5 rounded-full capitalize">
                      {todayLabel()}
                    </span>
                  </div>

                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'self-end flex-row-reverse' : ''}`}
                    >
                      <div className={`flex flex-col gap-1 w-full ${msg.role === 'user' ? 'items-end' : ''}`}>
                        <span className={`text-[11px] font-semibold text-on-surface-variant ${msg.role === 'user' ? 'mr-1' : 'ml-1'}`}>
                          {msg.role === 'user' ? 'Vous' : 'Support'}
                        </span>

                        {/* Bubble */}
                        <div className={`p-5 rounded-2xl shadow-sm text-[15px] leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-primary text-on-primary rounded-br-sm shadow-[0_4px_15px_rgba(0,17,66,0.15)]'
                            : 'bg-surface-container-lowest border border-surface-variant text-on-surface rounded-bl-sm shadow-[0_2px_10px_rgba(0,17,66,0.02)]'
                        }`}>
                          {msg.isMarkdown ? renderMarkdown(msg.text, handleLinkClick) : msg.text}
                          
                          {/* File attachment */}
                          {msg.file && (
                            <div className="mt-3 bg-white/10 border border-white/5 p-3 rounded-xl flex items-center gap-3">
                              <span className="material-symbols-outlined text-inverse-primary" style={{ fontSize: '20px' }}>attach_file</span>
                              <div>
                                <p className="text-[12px] font-bold text-white">{msg.file.name}</p>
                                <p className="text-[10px] text-inverse-primary opacity-80">{msg.file.size}</p>
                              </div>
                            </div>
                          )}

                          <div className={`text-[10px] mt-3 font-medium ${msg.role === 'user' ? 'text-inverse-primary text-right' : 'text-on-surface-variant'}`}>
                            {msg.time}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Typing dots */}
                  {typing && (
                    <div className="flex gap-4 max-w-[85%] items-end mt-2">
                      <div className="flex flex-col gap-1 w-full">
                        <span className="text-[11px] font-semibold text-on-surface-variant ml-1">Support</span>
                        <div className="bg-surface-container-lowest border border-surface-variant py-3 px-5 rounded-full flex gap-1.5 items-center w-fit shadow-[0_2px_10px_rgba(0,17,66,0.02)]">
                          {[0, 150, 300].map((delay, i) => (
                            <div
                              key={i}
                              className="w-1.5 h-1.5 bg-on-surface-variant rounded-full opacity-60 animate-bounce"
                              style={{ animationDelay: `${delay}ms` }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Input bar */}
                <div className="p-5 bg-surface z-10 shrink-0">
                  <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-2 flex flex-col shadow-[0_2px_8px_rgba(0,17,66,0.04)] focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
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
                      placeholder='Tapez votre message... ex: "42", "devis de Martin" ou "devis du 23/04"'
                      className="w-full bg-transparent border-none focus:ring-0 resize-none h-[48px] p-3 text-on-surface placeholder-on-surface-variant/60 text-[14px] font-body"
                    />
                    <div className="flex justify-between items-center px-1 pt-2 mt-1">
                      <button
                        onClick={() => fileRef.current?.click()}
                        className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors flex items-center justify-center"
                        title="Joindre un fichier"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>attach_file</span>
                      </button>
                      <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />
                      
                      <button
                        onClick={() => sendMessage()}
                        disabled={!input.trim() || typing}
                        className="bg-tertiary-fixed-dim text-tertiary-container font-bold px-5 py-2.5 rounded-xl hover:brightness-95 disabled:opacity-50 transition-all flex items-center gap-2 text-[13px] tracking-wide uppercase shadow-sm"
                      >
                        Envoyer
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>send</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Side Details Panel */}
                <AnimatePresence>
                  {selectedItem && (
                    <motion.div
                      initial={{ x: '100%', opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: '100%', opacity: 0 }}
                      className="absolute inset-y-0 right-0 w-full sm:w-[400px] bg-white border-l border-surface-variant shadow-2xl z-20 flex flex-col overflow-hidden"
                    >
                      <div className="bg-surface-container-low border-b border-surface-variant p-6 flex items-center justify-between">
                        <h3 className="font-bold text-[10px] text-primary uppercase tracking-[0.2em] font-headline">Détails du document</h3>
                        <button 
                          onClick={() => setSelectedItem(null)}
                          className="w-8 h-8 rounded-full hover:bg-surface-variant flex items-center justify-center transition-colors"
                        >
                          <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '18px' }}>close</span>
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto p-8 space-y-8 font-body">
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
                                <h4 className="text-xl font-bold text-primary">
                                  {selectedItem.type === 'quote' ? 'Devis' : 'Facture'} #{selectedItem.data.number}
                                </h4>
                                <span className="text-xs font-bold text-on-surface-variant bg-surface-container-low px-2 py-1 rounded-md uppercase tracking-wider">
                                  {selectedItem.data.status}
                                </span>
                              </div>
                            </div>

                            <div className="grid gap-6">
                              <div className="bg-surface-container-low p-4 rounded-2xl border border-surface-variant">
                                <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">Informations Client</p>
                                <div className="flex items-center gap-3 mb-2">
                                  <User size={16} className="text-primary/40" />
                                  <span className="text-sm font-bold text-on-surface">{selectedItem.data.clients?.name}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Calendar size={16} className="text-primary/40" />
                                  <span className="text-sm font-medium text-on-surface-variant">Créé le {new Date(selectedItem.data.created_at).toLocaleDateString('fr-FR')}</span>
                                </div>
                              </div>

                              <div className="bg-primary p-6 rounded-2xl text-on-primary shadow-xl">
                                <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-2 text-center">Montant Total</p>
                                <p className="text-3xl font-bold text-center tabular-nums">
                                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(selectedItem.data.total_ttc)}
                                </p>
                              </div>
                            </div>

                            <div className="pt-4 border-t border-surface-variant">
                               <a 
                                 href={`/dashboard/${selectedItem.type === 'quote' ? 'quotes' : 'invoices'}/${selectedItem.id}`}
                                 className="w-full h-14 bg-surface-container-low hover:bg-surface-container-high border border-surface-variant flex items-center justify-center gap-2 rounded-2xl text-[12px] font-bold text-primary uppercase tracking-widest transition-all"
                               >
                                 Voir la page complète
                                 <span className="material-symbols-outlined" style={{ fontSize: '14px', marginLeft: '4px' }}>open_in_new</span>
                               </a>
                            </div>
                          </div>
                        ) : (
                          <p className="text-center text-on-surface-variant py-12">Données indisponibles.</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
