import { Request, Response } from 'express';
import { pricingService } from '../services/pricing.service';
import { asyncHandler } from '../utils/asyncHandler';

export const pricingController = {
  addPrice: asyncHandler(async (req: Request, res: Response) => {
    const price = await pricingService.addPricePoint(req.params.partId, req.body, req.user!.userId);
    res.status(201).json(price);
  }),

  getHistory: asyncHandler(async (req: Request, res: Response) => {
    const { from, to } = req.query as { from?: Date; to?: Date };
    const history = await pricingService.getHistory(req.params.partId, from, to);
    res.status(200).json(history);
  }),

  getPriceAsOf: asyncHandler(async (req: Request, res: Response) => {
    const { date } = req.query as unknown as { date: Date };
    const price = await pricingService.getPriceAsOf(req.params.partId, date);
    res.status(200).json(price);
  }),

  calculateConfigurationPrice: asyncHandler(async (req: Request, res: Response) => {
    const { date } = req.query as unknown as { date: Date };
    const result = await pricingService.calculateConfigurationPrice(req.params.configId, date);
    res.status(200).json(result);
  }),

  compareOverTime: asyncHandler(async (req: Request, res: Response) => {
    const { date } = req.query as unknown as { date: Date };
    const result = await pricingService.compareConfigurationPriceOverTime(req.params.configId, date);
    res.status(200).json(result);
  }),
};
