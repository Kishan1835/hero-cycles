import { Router } from 'express';
import authRoutes from './auth.routes';
import partRoutes from './part.routes';
import pricingRoutes from './pricing.routes';
import configurationRoutes from './configuration.routes';
import { dashboardRouter, adminRouter } from './dashboard.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/parts', partRoutes);
router.use('/pricing', pricingRoutes);
router.use('/configurations', configurationRoutes);
router.use('/dashboard', dashboardRouter);
router.use('/admin', adminRouter);

export default router;
