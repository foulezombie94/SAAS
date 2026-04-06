import { z } from 'zod';

export const SendEmailSchema = z.object({
  quoteId: z.string().uuid("ID du devis invalide"),
  subject: z.string().min(3, "Le sujet doit faire au moins 3 caractères").max(200, "Le sujet est trop long").optional(),
  message: z.string().min(10, "Le message doit faire au moins 10 caractères").max(5000, "Le message est trop long"),
}).strict();

export type SendEmailInput = z.infer<typeof SendEmailSchema>;
