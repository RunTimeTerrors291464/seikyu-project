import { z } from "zod";

export const lineItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  sku: z.string().min(1),
  name: z.string(),
  unit: z.string(),
  qty: z.number().positive(),
  unitPrice: z.number().min(0),
  discountPct: z.number().min(0).max(100).optional().default(0),
  total: z.number().min(0),
});

export const invoiceSchema = z.object({
  id: z.string().optional(),
  number: z.string().optional(),
  status: z
    .enum(["CREATED", "PARTIAL_RETURN", "RETURN", "CANCELLED"]) 
    .default("CREATED"),
  customerId: z.string().min(1),
  createdAt: z.string(),
  postingAt: z.string(),
  items: z.array(lineItemSchema).min(1),
  subtotal: z.number().min(0),
  discountType: z.enum(["PERCENT", "AMOUNT"]).optional(),
  discountValue: z.number().min(0).optional(),
  taxIncluded: z.boolean().optional(),
  total: z.number().min(0),
  note: z.string().max(2000).optional(),
  attachmentUrl: z.string().url().optional(),
  returnAgainstId: z.string().optional(),
});
