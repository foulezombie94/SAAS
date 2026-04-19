'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie, XCircle, CheckCircle2 } from 'lucide-react'

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('artisanflow_cookie_consent')
    if (!consent) {
      // Show with a slight delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('artisanflow_cookie_consent', 'accepted')
    setIsVisible(false)
  }

  const handleDecline = () => {
    localStorage.setItem('artisanflow_cookie_consent', 'declined')
    setIsVisible(false)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.9 }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:max-w-md z-[100]"
        >
          <div className="bg-[#00236f] text-white p-6 rounded-[2rem] shadow-[0_20px_50px_rgba(0,35,111,0.3)] border border-white/10 backdrop-blur-xl bg-opacity-95">
            <div className="flex items-start gap-5">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                <Cookie size={24} className="text-[#ef9900]" />
              </div>
              
              <div className="flex-1">
                <h3 className="font-headline font-black text-sm uppercase tracking-widest mb-2 flex items-center gap-2">
                  Cookies & Contrôle
                </h3>
                <p className="font-body text-[11px] font-medium leading-relaxed opacity-80 mb-6">
                  Nous utilisons des cookies pour optimiser votre expérience de pilotage. En poursuivant votre navigation, vous acceptez l'usage de ces outils de précision.
                </p>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleAccept}
                    className="flex-1 bg-white text-[#00236f] py-3 rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-[#ef9900] hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={14} />
                    Accepter
                  </button>
                  <button 
                    onClick={handleDecline}
                    className="px-6 py-3 border border-white/20 rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-white/5 transition-all text-white/50 hover:text-white"
                  >
                    Refuser
                  </button>
                </div>
              </div>

              <button 
                onClick={() => setIsVisible(false)}
                className="text-white/30 hover:text-white transition-colors"
              >
                <XCircle size={20} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
