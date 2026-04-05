"use client";

import React from "react";
import { motion } from "framer-motion";
import { FileText, CreditCard, PenTool, Zap, CheckCircle2 } from "lucide-react";

const features = [
  {
    title: "Devis Instantanés",
    description: "Créez des devis professionnels en moins de 2 minutes, directement depuis votre téléphone sur le chantier.",
    icon: FileText,
    color: "var(--primary)",
  },
  {
    title: "Facturation Automatique",
    description: "Convertissez vos devis en factures d'un seul clic dès que le travail est terminé.",
    icon: Zap,
    color: "#ef4444",
  },
  {
    title: "Paiements Simplifiés",
    description: "Acceptez les paiements par carte bancaire et recevez vos fonds directement sur votre compte.",
    icon: CreditCard,
    color: "var(--tertiary)",
  },
  {
    title: "Signature Électronique",
    description: "Faites signer vos devis et PV de réception de travaux instantanément sur votre écran.",
    icon: PenTool,
    color: "#10b981",
  },
];

export const Features = () => {
  return (
    <section id="features" className="py-24 bg-surface">
      <div className="container">
        <div className="mb-20 text-center" style={{ maxWidth: '800px', margin: '0 auto 5rem auto' }}>
          <h2 className="text-primary mb-6" style={{ fontSize: '2.5rem', fontWeight: 800 }}>
            Tout ce dont un <span className="text-tertiary">artisan</span> a besoin
          </h2>
          <p className="text-lg text-on-surface-variant">
            Gérez votre entreprise sans stress. ArtisanFlow s'occupe de la paperasse, 
            vous vous occupez du chantier.
          </p>
        </div>

        <div className="grid grid-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="surface-card"
              style={{ display: 'flex', flexDirection: 'column' }}
            >
              <div 
                className="mb-6 flex items-center justify-center shadow-diffused"
                style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '12px',
                  backgroundColor: `${feature.color}15` 
                }}
              >
                <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
              </div>
              <h3 className="text-primary mb-4" style={{ fontSize: '1.25rem', fontWeight: 700 }}>{feature.title}</h3>
              <p className="text-on-surface-variant" style={{ fontSize: '0.95rem', lineHeight: 1.6 }}>
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="py-20 mx-auto" style={{ marginTop: '5rem', maxWidth: '1000px' }}>
          <div className="surface-card bg-primary-container text-on-primary p-6 flex items-center justify-between gap-8 md-flex-row" style={{ borderRadius: 'var(--radius-lg)' }}>
            <div className="flex-col gap-4">
              <h3 className="text-2xl font-extrabold" style={{ color: 'white' }}>Prêt à digitaliser votre activité ?</h3>
              <p className="opacity-90">Rejoignez plus de 500 artisans qui nous font confiance.</p>
            </div>
            <div className="flex flex-wrap gap-6 items-center">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-tertiary" />
                <span>Sans engagement</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-tertiary" />
                <span>14 jours offerts</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
