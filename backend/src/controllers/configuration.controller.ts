import { Request, Response } from 'express';
import { configurationService } from '../services/configuration.service';
import { asyncHandler } from '../utils/asyncHandler';

export const configurationController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const config = await configurationService.create(req.body, req.user!.userId);
    res.status(201).json(config);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const config = await configurationService.getById(req.params.id);
    res.status(200).json(config);
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const { isActive, search, page, pageSize } = req.query as any;
    const result = await configurationService.list({
      isActive: isActive === undefined ? undefined : isActive === 'true',
      search,
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
    });
    res.status(200).json(result);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const config = await configurationService.update(req.params.id, req.body, req.user!.userId);
    res.status(200).json(config);
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await configurationService.delete(req.params.id, req.user!.userId);
    res.status(204).send();
  }),

  addPart: asyncHandler(async (req: Request, res: Response) => {
    const { partId, quantity } = req.body;
    const config = await configurationService.addPart(req.params.id, partId, quantity, req.user!.userId);
    res.status(200).json(config);
  }),

  updatePart: asyncHandler(async (req: Request, res: Response) => {
    const { quantity } = req.body;
    const config = await configurationService.updatePartQuantity(
      req.params.id,
      req.params.partId,
      quantity,
      req.user!.userId
    );
    res.status(200).json(config);
  }),

  removePart: asyncHandler(async (req: Request, res: Response) => {
    const config = await configurationService.removePart(req.params.id, req.params.partId, req.user!.userId);
    res.status(200).json(config);
  }),
};
