import { authService } from '../../src/services/auth.service';
import { userRepository } from '../../src/repositories/user.repository';
import { UnauthorizedError, ConflictError, ForbiddenError } from '../../src/utils/errors';
import * as passwordUtil from '../../src/utils/password';

jest.mock('../../src/repositories/user.repository');
jest.mock('../../src/services/audit.service', () => ({ recordAudit: jest.fn() }));

const mockedUserRepo = userRepository as jest.Mocked<typeof userRepository>;

describe('authService.login', () => {
  it('throws UnauthorizedError for a non-existent email', async () => {
    mockedUserRepo.findByEmail.mockResolvedValue(null);

    await expect(
      authService.login({ email: 'ghost@herocycles.com', password: 'x' })
    ).rejects.toThrow(UnauthorizedError);
  });

  it('throws ForbiddenError for a deactivated account', async () => {
    mockedUserRepo.findByEmail.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      isActive: false,
      passwordHash: 'hash',
    } as any);

    await expect(authService.login({ email: 'a@b.com', password: 'x' })).rejects.toThrow(
      ForbiddenError
    );
  });

  it('throws UnauthorizedError for an incorrect password', async () => {
    mockedUserRepo.findByEmail.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      isActive: true,
      passwordHash: 'hash',
    } as any);
    jest.spyOn(passwordUtil, 'comparePassword').mockResolvedValue(false);

    await expect(authService.login({ email: 'a@b.com', password: 'wrong' })).rejects.toThrow(
      UnauthorizedError
    );
  });

  it('returns a token and sanitized user on successful login', async () => {
    mockedUserRepo.findByEmail.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      isActive: true,
      passwordHash: 'hash',
      role: 'SALESPERSON',
    } as any);
    jest.spyOn(passwordUtil, 'comparePassword').mockResolvedValue(true);

    const result = await authService.login({ email: 'a@b.com', password: 'correct' });

    expect(result.token).toEqual(expect.any(String));
    expect(result.user).not.toHaveProperty('passwordHash');
  });
});

describe('authService.register', () => {
  it('throws ConflictError when the email is already registered', async () => {
    mockedUserRepo.findByEmail.mockResolvedValue({ id: 'existing' } as any);

    await expect(
      authService.register({ name: 'A', email: 'a@b.com', password: 'password123', role: 'SALESPERSON' } as any)
    ).rejects.toThrow(ConflictError);
  });
});
