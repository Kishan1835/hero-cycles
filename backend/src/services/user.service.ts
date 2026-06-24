import { Role } from '@prisma/client';
import { userRepository } from '../repositories/user.repository';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { recordAudit } from './audit.service';

export const userService = {
  async list() {
    return userRepository.list();
  },

  async setActive(targetUserId: string, isActive: boolean, actingUserId: string) {
    const user = await userRepository.findById(targetUserId);
    if (!user) throw new NotFoundError('User not found');
    if (targetUserId === actingUserId && !isActive) {
      throw new BadRequestError('You cannot deactivate your own account');
    }
    const updated = await userRepository.setActive(targetUserId, isActive);
    await recordAudit({
      userId: actingUserId,
      action: 'UPDATE',
      entityType: 'User',
      entityId: targetUserId,
      metadata: { isActive },
    });
    return updated;
  },

  async updateRole(targetUserId: string, role: Role, actingUserId: string) {
    const user = await userRepository.findById(targetUserId);
    if (!user) throw new NotFoundError('User not found');
    if (targetUserId === actingUserId) {
      throw new BadRequestError('You cannot change your own role');
    }
    const updated = await userRepository.updateRole(targetUserId, role);
    await recordAudit({
      userId: actingUserId,
      action: 'UPDATE',
      entityType: 'User',
      entityId: targetUserId,
      metadata: { role },
    });
    return updated;
  },
};
