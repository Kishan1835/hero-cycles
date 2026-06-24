import { z } from 'zod';

export const configPartInputSchema = z.object({
  partId: z.string().uuid(),
  quantity: z.coerce.number().int().positive().default(1),
});

export const createConfigurationSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  modelCode: z.string().min(2).max(40),
  parts: z.array(configPartInputSchema).min(1, 'A configuration must include at least one part'),
});

export const updateConfigurationSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

export const addConfigPartSchema = configPartInputSchema;

export const updateConfigPartSchema = z.object({
  quantity: z.coerce.number().int().positive(),
});

export const configIdParamSchema = z.object({
  id: z.string().uuid('Invalid configuration ID'),
});

export type CreateConfigurationInput = z.infer<typeof createConfigurationSchema>;
export type UpdateConfigurationInput = z.infer<typeof updateConfigurationSchema>;
