import { Router } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { dashboardController, userController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';

const dashboardRouter = Router();
dashboardRouter.use(authenticate);
dashboardRouter.get('/summary', dashboardController.getSummary);

const adminRouter = Router();
adminRouter.use(authenticate, authorize(Role.ADMIN));

adminRouter.get('/users', userController.list);

adminRouter.patch(
  '/users/:id/active',
  validate({
    params: z.object({ id: z.string().uuid() }),
    body: z.object({ isActive: z.boolean() }),
  }),
  userController.setActive
);

adminRouter.patch(
  '/users/:id/role',
  validate({
    params: z.object({ id: z.string().uuid() }),
    body: z.object({ role: z.nativeEnum(Role) }),
  }),
  userController.updateRole
);

export { dashboardRouter, adminRouter };
