import { Router } from 'express';
import { Role } from '@prisma/client';
import { partController } from '../controllers/part.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import {
  createPartSchema,
  listPartsQuerySchema,
  partIdParamSchema,
  updatePartSchema,
} from '../validators/part.validator';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /api/parts:
 *   get:
 *     summary: List parts (filterable, paginated)
 *     tags: [Parts]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/', validate({ query: listPartsQuerySchema }), partController.list);

/**
 * @openapi
 * /api/parts/{id}:
 *   get:
 *     summary: Get a single part
 *     tags: [Parts]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/:id', validate({ params: partIdParamSchema }), partController.getById);

// Mutations restricted to PRICING_MANAGER and ADMIN — salespeople are
// read-only on the parts catalog.
router.post(
  '/',
  authorize(Role.PRICING_MANAGER, Role.ADMIN),
  validate({ body: createPartSchema }),
  partController.create
);

router.patch(
  '/:id',
  authorize(Role.PRICING_MANAGER, Role.ADMIN),
  validate({ params: partIdParamSchema, body: updatePartSchema }),
  partController.update
);

// Delete restricted to ADMIN only — destructive operation.
router.delete(
  '/:id',
  authorize(Role.ADMIN),
  validate({ params: partIdParamSchema }),
  partController.delete
);

export default router;
