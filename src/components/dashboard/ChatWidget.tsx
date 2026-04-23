'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Paperclip, Sparkles } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'agent'
  text: string
  time: string
  file?: { name: string; size: string }
  aiAssisted?: boolean
}

function nowLabel() {
  return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}
function todayLabel() {
  return new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [started, setStarted] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300)
      // Send greeting on first open
      if (!started) {
        setStarted(true)
        setTyping(true)
        setTimeout(() => {
          setMessages([{
            id: crypto.randomUUID(),
            role: 'agent',
            text: "Bonjour 👋 Bienvenue sur ArtisanFlow Support. Comment puis-je vous aider aujourd'hui ?",
            time: nowLabel(),
          }])
          setTyping(false)
        }, 1000)
      }
    }
  }, [open, started])

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const sendMessage = (text = input.trim(), file?: { name: string; size: string }) => {
    if (!text && !file) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text,
      time: nowLabel(),
      file,
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setTyping(true)

    setTimeout(() => {
      const keywords: [string, string][] = [
        ['devis', "📄 Pour créer un devis, rendez-vous dans **Devis → Nouveau devis** depuis le menu latéral."],
        ['facture', "🧾 Vos factures sont disponibles dans la section **Factures**. Vous pouvez les exporter en PDF directement."],
        ['client', "👤 Gérez vos clients dans la section **Clients**. Ajoutez-en un via le bouton **+** en haut."],
        ['paiement', "💳 Les paiements sont traités via Stripe. Contactez-nous si un paiement est bloqué."],
        ['erreur', "🔧 Décrivez-moi l'erreur précisément et je lancerai un diagnostic pour vous aider."],
        ['aide', "💡 Je suis là pour vous aider ! Posez votre question et je ferai de mon mieux pour y répondre."],
      ]
      const matched = keywords.find(([k]) => text.toLowerCase().includes(k))
      const replyText = matched
        ? matched[1]
        : "Merci pour votre message. Notre équipe va analyser votre demande et vous répondra dans les plus brefs délais. 🙏"

      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'agent',
        text: replyText,
        time: nowLabel(),
        aiAssisted: true,
      }])
      setTyping(false)
    }, 1400)
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

      {/* ── Modal overlay ── */}
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

            {/* Chat panel – centré */}
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
                {/* ── Header ── */}
                <div className="bg-gradient-to-br from-[#001142] to-[#00236f] px-6 py-5 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                        <Sparkles size={20} className="text-white" />
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#001142] rounded-full" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.18em]">Support en ligne</p>
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

                {/* ── Date separator ── */}
                <div className="flex justify-center pt-5 shrink-0">
                  <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-4 py-1.5 rounded-full capitalize">
                    {todayLabel()}
                  </span>
                </div>

                {/* ── Messages ── */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5" style={{ scrollbarWidth: 'thin' }}>
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} max-w-[85%] ${msg.role === 'user' ? 'ml-auto' : ''}`}>
                      {/* Avatar */}
                      {msg.role === 'agent' && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#001142] to-[#00236f] flex items-center justify-center shrink-0 self-end mb-1">
                          <Sparkles size={14} className="text-white" />
                        </div>
                      )}

                      <div className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : ''}`}>
                        {/* Label + AI badge */}
                        <div className={`flex items-center gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {msg.role === 'user' ? 'Vous' : 'Support'}
                          </span>
                          {msg.aiAssisted && (
                            <span className="bg-slate-100 text-[#001142] text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                              IA Assisté
                            </span>
                          )}
                        </div>

                        {/* Bubble */}
                        {msg.text && (
                          <div className={`px-4 py-3 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                            msg.role === 'user'
                              ? 'bg-[#001142] text-white rounded-br-sm'
                              : 'bg-white border border-slate-100 text-slate-700 rounded-bl-sm'
                          }`}>
                            {msg.text}
                            <p className={`text-[9px] mt-2 font-bold ${msg.role === 'user' ? 'text-white/40 text-right' : 'text-slate-300'}`}>
                              {msg.time}
                            </p>
                          </div>
                        )}

                        {/* File attachment */}
                        {msg.file && (
                          <div className="mt-1 bg-blue-50/60 border border-blue-100 p-2.5 rounded-xl flex items-center gap-3 self-end">
                            <div className="w-9 h-9 bg-[#00236f] text-white rounded-lg flex items-center justify-center shrink-0">
                              <Paperclip size={15} />
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

                  {/* Typing indicator */}
                  {typing && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#001142] to-[#00236f] flex items-center justify-center shrink-0 self-end mb-1">
                        <Sparkles size={14} className="text-white" />
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

                {/* ── Input ── */}
                <div className="px-6 pb-6 pt-3 bg-[#faf8ff] border-t border-slate-100 shrink-0">
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
                      placeholder="Écrivez votre message…"
                      className="w-full bg-transparent border-none focus:ring-0 resize-none text-[13px] text-slate-700 placeholder:text-slate-400 leading-relaxed"
                    />
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-1">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
                        title="Joindre un fichier"
                      >
                        <Paperclip size={17} />
                      </button>
                      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFile} />
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={() => sendMessage()}
                        disabled={!input.trim()}
                        className="bg-amber-400 hover:bg-amber-300 disabled:opacity-30 disabled:cursor-not-allowed text-[#001142] font-black text-[12px] uppercase tracking-wider px-5 py-2 rounded-xl flex items-center gap-2 transition-colors"
                      >
                        Envoyer
                        <Send size={14} />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
