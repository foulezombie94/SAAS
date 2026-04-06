'use client';

import DOMPurify from 'isomorphic-dompurify';
import { useEffect, useState } from 'react';

interface SafeHtmlProps {
  content: string;
  className?: string;
}

/**
 * Composant de rendu HTML sécurisé.
 * Utilise DOMPurify pour nettoyer tout contenu HTML potentiellement dangereux (XSS).
 * À utiliser obligatoirement pour tout affichage de texte riche provenant de l'utilisateur.
 */
export default function SafeHtml({ content, className }: SafeHtmlProps) {
  const [sanitizedHtml, setSanitizedHtml] = useState<string>('');

  useEffect(() => {
    // Purification stricte du HTML
    const clean = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'span'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
      USE_PROFILES: { html: true },
    });
    setSanitizedHtml(clean);
  }, [content]);

  // Rendu sécurisé via dangerouslySetInnerHTML (après purification)
  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }} 
    />
  );
}
