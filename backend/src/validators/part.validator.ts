import { z } from 'zod';
import { PartCategory, PartStatus } from '@prisma/client';

export const createPartSchema = z.object({
  name: z.string().min(2).max(120),
  category: z.nativeEnum(PartCategory),
  sku: z.string().min(2).max(40),
  status: z.nativeEnum(PartStatus).default(PartStatus.ACTIVE),
  // Initial price is required at creation time — a part without any
  // price history can't be priced into a configuration.
  initialCost: z.coerce.number().positive('Cost must be a positive number'),
  effectiveDate: z.coerce.date().default(() => new Date()),
});

export const updatePartSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  category: z.nativeEnum(PartCategory).optional(),
  status: z.nativeEnum(PartStatus).optional(),
});

export const listPartsQuerySchema = z.object({
  category: z.nativeEnum(PartCategory).optional(),
  status: z.nativeEnum(PartStatus).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const partIdParamSchema = z.object({
  id: z.string().uuid('Invalid part ID'),
});

export type CreatePartInput = z.infer<typeof createPartSchema>;
export type UpdatePartInput = z.infer<typeof updatePartSchema>;
export type ListPartsQuery = z.infer<typeof listPartsQuerySchema>;
