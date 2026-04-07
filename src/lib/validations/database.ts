import { z } from 'zod';
import { Constants } from '@/types/constants';
import { sanitizeString } from './secure-inputs';

// -------------------------------------------------------------------------
// 1. Enums (Source of Truth: constants.ts)
// -------------------------------------------------------------------------
// 🚀 Correction du typage strict pour Zod (Grade 10) : cast as unique array tuple
export const quoteStatusSchema = z.enum(Constants.public.Enums.quote_status as unknown as [string, ...string[]]);
export const invoiceStatusSchema = z.enum(Constants.public.Enums.invoice_status as unknown as [string, ...string[]]);

// -------------------------------------------------------------------------
// 2. Base Entities
// -------------------------------------------------------------------------

export const clientBaseSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: sanitizeString,
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  postal_code: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  created_at: z.string().datetime().nullable().optional(),
});

export const quoteBaseSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  client_id: z.string().uuid(),
  number: z.string(),
  status: quoteStatusSchema,
  total_ht: z.coerce.number(),
  tax_rate: z.coerce.number(),
  total_ttc: z.coerce.number(),
  public_token: z.string().nullable().optional(),
  public_token_expires_at: z.string().datetime().nullable().optional(),
  valid_until: z.string().datetime().nullable().optional(),
  signature_url: z.string().nullable().optional(),
  paid_at: z.string().datetime().nullable().optional(),
  updated_at: z.string().datetime().nullable().optional(),
  created_at: z.string().datetime().nullable().optional(),
  last_viewed_at: z.string().datetime().nullable().optional(),
});

export const invoiceBaseSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  client_id: z.string().uuid(),
  quote_id: z.string().uuid().nullable().optional(),
  number: z.string(),
  status: invoiceStatusSchema,
  total_ht: z.coerce.number(),
  tax_rate: z.coerce.number(),
  total_ttc: z.coerce.number(),
  due_date: z.string().datetime().nullable().optional(),
  stripe_session_id: z.string().nullable().optional(),
  created_at: z.string().datetime().nullable().optional(),
});

// -------------------------------------------------------------------------
// 3. Rich Entities (with Relations)
// -------------------------------------------------------------------------

export const quoteWithClientSchema = quoteBaseSchema.extend({
  clients: z.object({
    name: z.string(),
  }).nullable().optional(),
});

export const invoiceWithClientSchema = invoiceBaseSchema.extend({
  clients: clientBaseSchema.nullable().optional(),
});

export const clientWithQuotesSchema = clientBaseSchema.extend({
  quotes: z.array(quoteBaseSchema).optional().default([]),
});

// -------------------------------------------------------------------------
// 4. Utility Types
// -------------------------------------------------------------------------

export type ValidatedQuote = z.infer<typeof quoteWithClientSchema>;
export type ValidatedInvoice = z.infer<typeof invoiceWithClientSchema>;
export type ValidatedClient = z.infer<typeof clientWithQuotesSchema>;
