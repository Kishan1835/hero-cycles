import { z } from 'zod';

export const addPriceSchema = z.object({
  cost: z.coerce.number().positive('Cost must be a positive number'),
  effectiveDate: z.coerce.date(),
  note: z.string().max(280).optional(),
});

export const priceHistoryQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const priceAtDateQuerySchema = z.object({
  date: z.coerce.date().default(() => new Date()),
});

export const calculatePriceQuerySchema = z.object({
  date: z.coerce.date().default(() => new Date()),
});

export type AddPriceInput = z.infer<typeof addPriceSchema>;
