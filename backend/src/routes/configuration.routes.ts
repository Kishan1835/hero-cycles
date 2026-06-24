import { Router } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { configurationController } from '../controllers/configuration.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import {
  createConfigurationSchema,
  updateConfigurationSchema,
  addConfigPartSchema,
  updateConfigPartSchema,
  configIdParamSchema,
} from '../validators/configuration.validator';

const router = Router();
router.use(authenticate);

const listQuerySchema = z.object({
  isActive: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
  page: z.string().optional(),
  pageSize: z.string().optional(),
});

const partParamSchema = configIdParamSchema.extend({ partId: z.string().uuid() });

router.get('/', validate({ query: listQuerySchema }), configurationController.list);
router.get('/:id', validate({ params: configIdParamSchema }), configurationController.getById);

// Salespeople can create configurations (core to their workflow);
// managers/admins can also edit and delete.
router.post(
  '/',
  validate({ body: createConfigurationSchema }),
  configurationController.create
);

router.patch(
  '/:id',
  authorize(Role.PRICING_MANAGER, Role.ADMIN),
  validate({ params: configIdParamSchema, body: updateConfigurationSchema }),
  configurationController.update
);

router.delete(
  '/:id',
  authorize(Role.ADMIN),
  validate({ params: configIdParamSchema }),
  configurationController.delete
);

router.post(
  '/:id/parts',
  validate({ params: configIdParamSchema, body: addConfigPartSchema }),
  configurationController.addPart
);

router.patch(
  '/:id/parts/:partId',
  validate({ params: partParamSchema, body: updateConfigPartSchema }),
  configurationController.updatePart
);

router.delete(
  '/:id/parts/:partId',
  validate({ params: partParamSchema }),
  configurationController.removePart
);

export default router;
