import { z } from 'zod';
import { sanitizeString, businessDescriptionSchema, statementDescriptorSchema } from './secure-inputs';

export const profileSchema = z.object({
  company_name: sanitizeString.min(1, "Le nom de l'entreprise est obligatoire"),
  first_name: sanitizeString.optional().nullable(),
  last_name: sanitizeString.optional().nullable(),
  siret: sanitizeString.optional().nullable(),
  address: sanitizeString.optional().nullable(),
  phone: sanitizeString.optional().nullable(),
  num_contacts: z.string().optional().nullable(),
  annual_revenue: z.string().optional().nullable(),
  preferred_language: z.enum(['fr', 'en', 'es']).default('fr'),
  business_description: businessDescriptionSchema,
  statement_descriptor: statementDescriptorSchema.optional().nullable(),
});

export type ProfileInput = z.infer<typeof profileSchema>;
