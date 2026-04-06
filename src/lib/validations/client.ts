import { z } from 'zod';
import { sanitizeString } from './secure-inputs';

export const clientSchema = z.object({
  name: sanitizeString.min(1, "Le nom du client est obligatoire"),
  email: z.string().email("Format d'email invalide").optional().nullable().or(z.literal('')),
  phone: sanitizeString.optional().nullable(),
  address: sanitizeString.optional().nullable(),
  city: sanitizeString.optional().nullable(),
  postal_code: sanitizeString.optional().nullable(),
  country: sanitizeString.default('France'),
  site_address: sanitizeString.optional().nullable(),
  notes: sanitizeString.optional().nullable(),
});

export type ClientInput = z.infer<typeof clientSchema>;
