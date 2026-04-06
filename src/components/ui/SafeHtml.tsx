import DOMPurify from 'isomorphic-dompurify';

interface SafeHtmlProps {
  content: string;
  className?: string;
}

/**
 * Composant de rendu HTML sécurisé.
 * Utilise DOMPurify pour nettoyer tout contenu HTML potentiellement dangereux (XSS).
 * Rendu synchrone pour éviter le Layout Shift (CLF) et améliorer le SEO.
 */
export default function SafeHtml({ content, className }: SafeHtmlProps) {
  // Purification stricte du HTML effectuée de manière synchrone (compatible SSR/Client)
  const clean = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    USE_PROFILES: { html: true },
  });

  // Rendu sécurisé via dangerouslySetInnerHTML
  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: clean }} 
    />
  );
}
