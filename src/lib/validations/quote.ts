import { z } from 'zod';
import { sanitizeString } from './secure-inputs';

export const PaymentDetailsSchema = z.object({
  method: z.enum(['card', 'transfer', 'cash']),
  transaction_id: z.string().optional(),
  paid_at: z.string().datetime().optional(),
}).strict();

export const QuoteItemInsertSchema = z.object({
  description: sanitizeString.min(1, "La description est requise"),
  quantity: z.number().min(1, "La quantité doit être au moins 1").max(1_000_000, "Quantité maximale dépassée"),
  unit_price: z.number().min(0, "Le prix unitaire doit être positif").max(1_000_000, "Prix maximal dépassé"),
  total_price: z.number().min(0).max(1_000_000),
  tax_rate: z.number().min(0).max(100),
  total_ht: z.number().min(0).max(10_000_000),
  total_ttc: z.number().min(0).max(15_000_000),
}).strict().superRefine((data, ctx) => {
  const epsilon = 0.01;
  const expectedTotalHt = data.quantity * data.unit_price;
  
  if (Math.abs(data.total_price - expectedTotalHt) > epsilon) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Total incohérent avec la quantité et le prix unitaire", path: ["total_price"] });
  }
  
  if (Math.abs(data.total_ht - expectedTotalHt) > epsilon) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Total HT incohérent avec la quantité et le prix unitaire", path: ["total_ht"] });
  }

  const expectedTotalTtc = data.total_ht * (1 + data.tax_rate / 100);
  if (Math.abs(data.total_ttc - expectedTotalTtc) > epsilon) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Total TTC incohérent avec le HT et la TVA", path: ["total_ttc"] });
  }
});

export const QuoteInsertSchema = z.object({
  client_id: z.string().uuid("L'ID client doit être un UUID valide"),
  status: z.enum(["draft", "sent", "accepted", "rejected", "invoiced", "paid", "overdue", "cancelled"]),
  description: sanitizeString.optional(),
  terms: sanitizeString.optional(),
  notes: sanitizeString.optional(),
  total_ht: z.number().min(0).max(10_000_000),
  tax_rate: z.number().min(0).max(100),
  total_ttc: z.number().min(0).max(15_000_000),
  payment_details: PaymentDetailsSchema.nullable().optional(),
  payment_method: z.string().nullable().optional(),
  valid_until: z.string().datetime().nullable().optional(),
  items: z.array(QuoteItemInsertSchema).min(1, "Le devis doit contenir au moins une prestation")
}).strict().superRefine((data, ctx) => {
  const epsilon = 0.01;
  const sumItemsHt = data.items.reduce((sum, item) => sum + item.total_ht, 0);

  if (Math.abs(data.total_ht - sumItemsHt) > epsilon) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Le total HT du devis ne correspond pas à la somme des prestations", path: ["total_ht"] });
  }

  const expectedTotalTtc = data.total_ht * (1 + data.tax_rate / 100);
  if (Math.abs(data.total_ttc - expectedTotalTtc) > epsilon) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Le total TTC du devis est incohérent avec le total HT et la TVA", path: ["total_ttc"] });
  }
});

// Schéma pour l'acceptation d'un devis (Signature)
export const QuoteAcceptSchema = z.object({
  quoteId: z.string().uuid("ID de devis invalide"),
  signatureDataUrl: z.string()
    .regex(
      /^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/]+=*$/,
      "Format de signature invalide (image base64 attendu)"
    )
    .min(100, "La signature semble vide"),
  publicToken: z.string().optional(),
  signerType: z.enum(['artisan', 'client']),
}).strict();


// Schéma pour l'envoi d'un devis par email
export const QuoteEmailSchema = z.object({
  quoteId: z.string().uuid("ID de devis invalide"),
  subject: sanitizeString.min(5, "Le sujet doit faire au moins 5 caractères"),
  message: sanitizeString.min(10, "Le message doit faire au moins 10 caractères"),
}).strict();
