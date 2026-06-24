import { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { userService } from '../services/user.service';
import { asyncHandler } from '../utils/asyncHandler';

export const dashboardController = {
  getSummary: asyncHandler(async (_req: Request, res: Response) => {
    const summary = await dashboardService.getSummary();
    res.status(200).json(summary);
  }),
};

export const userController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const users = await userService.list();
    res.status(200).json(users);
  }),

  setActive: asyncHandler(async (req: Request, res: Response) => {
    const { isActive } = req.body;
    const user = await userService.setActive(req.params.id, isActive, req.user!.userId);
    res.status(200).json(user);
  }),

  updateRole: asyncHandler(async (req: Request, res: Response) => {
    const { role } = req.body;
    const user = await userService.updateRole(req.params.id, role, req.user!.userId);
    res.status(200).json(user);
  }),
};
