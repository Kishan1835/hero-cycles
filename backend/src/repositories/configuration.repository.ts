import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

const configWithParts = Prisma.validator<Prisma.BicycleConfigurationDefaultArgs>()({
  include: {
    parts: { include: { part: true } },
    createdBy: { select: { id: true, name: true, email: true } },
  },
});

export type ConfigurationWithParts = Prisma.BicycleConfigurationGetPayload<typeof configWithParts>;

export const configurationRepository = {
  async create(data: {
    name: string;
    description?: string;
    modelCode: string;
    createdById: string;
    parts: { partId: string; quantity: number }[];
  }): Promise<ConfigurationWithParts> {
    return prisma.bicycleConfiguration.create({
      data: {
        name: data.name,
        description: data.description,
        modelCode: data.modelCode,
        createdById: data.createdById,
        parts: { create: data.parts },
      },
      ...configWithParts,
    });
  },

  async findById(id: string): Promise<ConfigurationWithParts | null> {
    return prisma.bicycleConfiguration.findUnique({ where: { id }, ...configWithParts });
  },

  async list(params: {
    isActive?: boolean;
    search?: string;
    page: number;
    pageSize: number;
  }): Promise<{ items: ConfigurationWithParts[]; total: number }> {
    const where: Prisma.BicycleConfigurationWhereInput = {
      ...(params.isActive !== undefined ? { isActive: params.isActive } : {}),
      ...(params.search
        ? {
            OR: [
              { name: { contains: params.search, mode: 'insensitive' } },
              { modelCode: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.bicycleConfiguration.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        ...configWithParts,
      }),
      prisma.bicycleConfiguration.count({ where }),
    ]);

    return { items, total };
  },

  async update(
    id: string,
    data: Partial<{ name: string; description: string; isActive: boolean }>
  ): Promise<ConfigurationWithParts> {
    return prisma.bicycleConfiguration.update({ where: { id }, data, ...configWithParts });
  },

  async delete(id: string): Promise<void> {
    await prisma.bicycleConfiguration.delete({ where: { id } });
  },

  async addPart(configurationId: string, partId: string, quantity: number): Promise<void> {
    await prisma.configurationPart.create({ data: { configurationId, partId, quantity } });
  },

  async updatePartQuantity(configurationId: string, partId: string, quantity: number): Promise<void> {
    await prisma.configurationPart.update({
      where: { configurationId_partId: { configurationId, partId } },
      data: { quantity },
    });
  },

  async removePart(configurationId: string, partId: string): Promise<void> {
    await prisma.configurationPart.delete({
      where: { configurationId_partId: { configurationId, partId } },
    });
  },

  async countActive(): Promise<number> {
    return prisma.bicycleConfiguration.count({ where: { isActive: true } });
  },
};
