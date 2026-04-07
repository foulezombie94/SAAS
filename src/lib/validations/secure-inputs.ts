import { z } from 'zod';

/**
 * Regex blindé pour détecter toute tentative d'injection HTML ou de script.
 * ⚠️ IMPORTANT: Ne PAS utiliser le flag 'g' ici. Les regex globales en JS
 * conservent un état interne (lastIndex) qui cause des faux positifs
 * aléatoires sur les appels successifs de .test().
 */
const noHtmlRegex = /<[^>]*>?/;

/**
 * Validateur Zod réutilisable pour assainir et sécuriser les entrées texte.
 * Rejette toute chaîne contenant des balises HTML ou des scripts potentiels.
 */
export const sanitizeString = z.string()
  .trim()
  .refine((val) => !noHtmlRegex.test(val), {
    message: "Les balises HTML ou scripts ne sont pas autorisés pour des raisons de sécurité.",
  });

/**
 * Schéma de validation pour l'inscription (Signup) intégrant le bouclier anti-XSS.
 */
export const signupSchema = z.object({
  email: z.string().email("Email invalide").trim(),
  password: z.string().min(8, "Le mot de passe doit faire au moins 8 caractères"),
  first_name: sanitizeString.min(2, "Prénom trop court"),
  last_name: sanitizeString.min(2, "Nom trop court"),
  company_name: sanitizeString.min(2, "Nom d'entreprise trop court"),
  phone: z.string().optional(),
  num_contacts: z.string().optional(),
  annual_revenue: z.string().optional(),
  preferred_language: z.enum(['fr', 'en']).default('fr'),
});
