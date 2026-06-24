import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { asyncHandler } from '../utils/asyncHandler';

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);
    res.status(200).json(result);
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json({ user: req.user });
  }),
};
