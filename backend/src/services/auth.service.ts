import { userRepository } from '../repositories/user.repository';
import { hashPassword, comparePassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { UnauthorizedError, ConflictError, ForbiddenError } from '../utils/errors';
import { LoginInput, RegisterInput } from '../validators/auth.validator';
import { recordAudit } from './audit.service';

export const authService = {
  async register(input: RegisterInput) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError('An account with this email already exists');
    }

    const passwordHash = await hashPassword(input.password);
    const user = await userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
    });

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    return { token, user: sanitize(user) };
  },

  async login(input: LoginInput) {
    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }
    if (!user.isActive) {
      throw new ForbiddenError('This account has been deactivated. Contact an administrator.');
    }

    const valid = await comparePassword(input.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    await recordAudit({ userId: user.id, action: 'LOGIN', entityType: 'User', entityId: user.id });

    return { token, user: sanitize(user) };
  },
};

function sanitize<T extends { passwordHash?: string }>(user: T) {
  const { passwordHash: _omit, ...rest } = user;
  return rest;
}
