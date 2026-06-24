import { Request, Response } from 'express';
import { partService } from '../services/part.service';
import { asyncHandler } from '../utils/asyncHandler';
import { CreatePartInput, ListPartsQuery, UpdatePartInput } from '../validators/part.validator';

export const partController = {
  create: asyncHandler(async (req: Request<unknown, unknown, CreatePartInput>, res: Response) => {
    const part = await partService.create(req.body, req.user!.userId);
    res.status(201).json(part);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const part = await partService.getById(req.params.id);
    res.status(200).json(part);
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await partService.list(req.query as unknown as ListPartsQuery);
    res.status(200).json(result);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const part = await partService.update(req.params.id, req.body as UpdatePartInput, req.user!.userId);
    res.status(200).json(part);
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await partService.delete(req.params.id, req.user!.userId);
    res.status(204).send();
  }),
};
