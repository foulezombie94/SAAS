import { z } from 'zod';

export const PaymentDetailsSchema = z.object({
  method: z.enum(['card', 'transfer', 'cash']),
  transaction_id: z.string().optional(),
  paid_at: z.string().optional(),
}).strict();

export const QuoteItemInsertSchema = z.object({
  description: z.string().min(1, "La description est requise"),
  quantity: z.number().min(0, "La quantité doit être positive").max(1_000_000, "Quantité maximale dépassée"),
  unit_price: z.number().min(0, "Le prix unitaire doit être positif").max(1_000_000, "Prix maximal dépassé"),
  total_price: z.number().min(0).max(1_000_000),
  tax_rate: z.number().min(0).max(100),
  total_ht: z.number().min(0).max(10_000_000),
  total_ttc: z.number().min(0).max(15_000_000),
}).strict();

export const QuoteInsertSchema = z.object({
  client_id: z.string().uuid("L'ID client doit être un UUID valide"),
  status: z.enum(["draft", "sent", "accepted", "rejected", "invoiced", "paid"]),
  total_ht: z.number().min(0).max(10_000_000),
  tax_rate: z.number().min(0).max(100),
  total_ttc: z.number().min(0).max(15_000_000),
  payment_details: PaymentDetailsSchema.nullable().optional(),
  payment_method: z.string().nullable().optional(),
  valid_until: z.string().nullable().optional(),
  items: z.array(QuoteItemInsertSchema).min(1, "Le devis doit contenir au moins une prestation")
}).strict();
