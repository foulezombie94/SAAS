import { z } from 'zod';
import { sanitizeString } from './secure-inputs';

export const SendEmailSchema = z.object({
  quoteId: z.string().uuid("ID du devis invalide"),
  subject: sanitizeString.min(3, "Le sujet doit faire au moins 3 caractères").max(200, "Le sujet est trop long").optional(),
  message: sanitizeString.min(10, "Le message doit faire au moins 10 caractères").max(5000, "Le message est trop long"),
}).strict();

export type SendEmailInput = z.infer<typeof SendEmailSchema>;
