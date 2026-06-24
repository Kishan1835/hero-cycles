import { Router } from 'express';
import { Role } from '@prisma/client';
import { pricingController } from '../controllers/pricing.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import {
  addPriceSchema,
  priceHistoryQuerySchema,
  priceAtDateQuerySchema,
  calculatePriceQuerySchema,
} from '../validators/pricing.validator';
import { partIdParamSchema } from '../validators/part.validator';
import { configIdParamSchema } from '../validators/configuration.validator';
import { z } from 'zod';

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /api/pricing/parts/{partId}/history:
 *   get:
 *     summary: Get full price history for a part
 *     tags: [Pricing]
 *     security: [{ bearerAuth: [] }]
 */
router.get(
  '/parts/:partId/history',
  validate({ params: partIdParamSchema as any, query: priceHistoryQuerySchema }),
  pricingController.getHistory
);

/**
 * @openapi
 * /api/pricing/parts/{partId}/as-of:
 *   get:
 *     summary: Get the price of a part as of a given date (defaults to today)
 *     tags: [Pricing]
 *     security: [{ bearerAuth: [] }]
 */
router.get(
  '/parts/:partId/as-of',
  validate({ params: partIdParamSchema as any, query: priceAtDateQuerySchema }),
  pricingController.getPriceAsOf
);

// Adding new price points is a Pricing Manager / Admin responsibility.
router.post(
  '/parts/:partId',
  authorize(Role.PRICING_MANAGER, Role.ADMIN),
  validate({ params: partIdParamSchema as any, body: addPriceSchema }),
  pricingController.addPrice
);

/**
 * @openapi
 * /api/pricing/configurations/{configId}/calculate:
 *   get:
 *     summary: Calculate total price + breakdown for a bicycle configuration as of a date
 *     tags: [Pricing]
 *     security: [{ bearerAuth: [] }]
 */
router.get(
  '/configurations/:configId/calculate',
  validate({ params: configIdParamSchema as any, query: calculatePriceQuerySchema }),
  pricingController.calculateConfigurationPrice
);

router.get(
  '/configurations/:configId/compare',
  validate({
    params: configIdParamSchema as any,
    query: z.object({ date: z.coerce.date() }),
  }),
  pricingController.compareOverTime
);

export default router;
