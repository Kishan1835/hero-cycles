import { Role, User } from '@prisma/client';
import { prisma } from '../config/prisma';

export const userRepository = {
  async create(data: { name: string; email: string; passwordHash: string; role: Role }): Promise<User> {
    return prisma.user.create({ data });
  },

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  },

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  },

  async list(): Promise<Omit<User, 'passwordHash'>[]> {
    return prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true, updatedAt: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  async setActive(id: string, isActive: boolean): Promise<User> {
    return prisma.user.update({ where: { id }, data: { isActive } });
  },

  async updateRole(id: string, role: Role): Promise<User> {
    return prisma.user.update({ where: { id }, data: { role } });
  },
};
