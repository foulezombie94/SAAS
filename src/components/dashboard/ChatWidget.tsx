'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Sparkles, ChevronDown } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
  time: string
}

const WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  text: "👋 Bonjour ! Je suis votre assistant ArtisanFlow. Comment puis-je vous aider aujourd'hui ?",
  time: now(),
}

function now() {
  return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [open, messages])

  const sendMessage = () => {
    const text = input.trim()
    if (!text) return

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', text, time: now() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setTyping(true)

    // Simulated assistant reply
    setTimeout(() => {
      const replies: Record<string, string> = {
        devis: "📄 Pour créer un devis, rendez-vous dans **Devis → Nouveau devis** depuis la barre latérale.",
        facture: "🧾 Vos factures sont disponibles dans la section **Factures**. Vous pouvez les exporter en PDF.",
        client: "👤 Gérez vos clients dans la section **Clients**. Ajoutez-en un nouveau via le bouton **+**.",
        aide: "💡 Consultez notre documentation ou contactez le support à **support@artisanflow.fr**.",
      }
      const key = Object.keys(replies).find(k => text.toLowerCase().includes(k))
      const replyText = key
        ? replies[key]
        : "Merci pour votre message ! Notre équipe vous répondra dans les plus brefs délais. 🙏"

      setMessages(prev => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', text: replyText, time: now() },
      ])
      setTyping(false)
    }, 1200)
  }

  return (
    <>
      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="fixed bottom-24 right-6 z-[100] w-[360px] max-h-[520px] flex flex-col rounded-[2rem] overflow-hidden shadow-2xl border border-white/20"
            style={{ boxShadow: '0 32px 64px rgba(0,35,111,0.18), 0 0 0 1px rgba(0,35,111,0.06)' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-[#00236f] to-[#0038b8] px-6 py-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                    <Sparkles size={18} className="text-white" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-[#00236f] rounded-full" />
                </div>
                <div>
                  <p className="text-[11px] font-black text-white/60 uppercase tracking-[0.18em]">Assistant</p>
                  <p className="text-sm font-bold text-white leading-tight">ArtisanFlow Support</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <ChevronDown size={16} className="text-white" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto bg-slate-50 px-4 py-4 space-y-3 custom-scrollbar" style={{ maxHeight: 320 }}>
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-2xl text-[12px] font-medium leading-relaxed shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-[#00236f] text-white rounded-br-md'
                        : 'bg-white text-slate-700 border border-slate-100 rounded-bl-md'
                    }`}
                  >
                    {msg.text}
                    <p className={`text-[9px] mt-1.5 font-bold ${msg.role === 'user' ? 'text-white/50 text-right' : 'text-slate-300'}`}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {typing && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm flex items-center gap-1.5">
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

            {/* Input */}
            <div className="bg-white border-t border-slate-100 px-4 py-3 flex items-center gap-3 shrink-0">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Écrivez un message…"
                className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-[12px] font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={sendMessage}
                disabled={!input.trim()}
                className="w-10 h-10 rounded-xl bg-[#00236f] hover:bg-[#001b54] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-lg shadow-primary/20"
              >
                <Send size={15} className="text-white" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className="fixed bottom-6 right-6 z-[100] w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00236f] to-[#0038b8] flex items-center justify-center shadow-2xl shadow-primary/30 border border-white/20 transition-all"
        style={{ boxShadow: '0 8px 32px rgba(0,35,111,0.35)' }}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <X size={22} className="text-white" />
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <MessageCircle size={22} className="text-white" />
            </motion.div>
          )}
        </AnimatePresence>
        {/* Pulse ring */}
        {!open && (
          <span className="absolute inset-0 rounded-2xl animate-ping bg-white/20 pointer-events-none" />
        )}
      </motion.button>
    </>
  )
}
