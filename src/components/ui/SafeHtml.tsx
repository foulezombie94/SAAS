'use client';

import DOMPurify from 'isomorphic-dompurify';
import { useMemo } from 'react';

interface SafeHtmlProps {
  content: string;
  className?: string;
}

/**
 * CONFIGURATION DE SÉCURITÉ DOMPURIFY
 * On s'assure que le hook n'est ajouté qu'une seule fois au chargement du module
 * pour éviter les fuites de mémoire ou les doublons lors du HMR (Hot Module Replacement).
 */
if (typeof window !== 'undefined' || typeof global !== 'undefined') {
  // @ts-ignore - On utilise une propriété globale pour tracker l'initialisation
  const g = (typeof window !== 'undefined' ? window : global) as any;
  
  if (!g.__DOMPurifyArtisanFlowInitialized) {
    DOMPurify.addHook('afterSanitizeAttributes', (node) => {
      // On ne traite que les liens <a> qui ont un href
      if (node.tagName === 'A' && node.getAttribute('href')) {
        const href = node.getAttribute('href') || '';
        
        // SÉCURITÉ : On ne force l'ouverture dans un nouvel onglet 
        // que pour les liens EXTERNES (http/https)
        if (href.startsWith('http')) {
          node.setAttribute('target', '_blank');
          node.setAttribute('rel', 'noopener noreferrer'); // Protection Tabnabbing
        }
      }
    });
    g.__DOMPurifyArtisanFlowInitialized = true;
  }
}

/**
 * Composant de rendu HTML sécurisé.
 * Utilise DOMPurify pour nettoyer tout contenu HTML potentiellement dangereux (XSS).
 * Rendu synchrone pour éviter le Layout Shift (CLS) et améliorer le SEO.
 */
export default function SafeHtml({ content, className }: SafeHtmlProps) {
  // Purification stricte du HTML effectuée de manière synchrone (compatible SSR/Client)
  // useMemo évite de re-sanitizer le même contenu à chaque render client
  const clean = useMemo(() => {
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'span'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
      ALLOWED_URI_REGEXP: /^(https?|mailto|tel):/i, // SÉCURITÉ : Bloque javascript:, data:, etc.
      USE_PROFILES: { html: true },
    });
  }, [content]);

  // Rendu sécurisé via dangerouslySetInnerHTML
  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: clean }} 
    />
  );
}

