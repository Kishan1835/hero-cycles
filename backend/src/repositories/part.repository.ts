import { Part, PartCategory, PartStatus, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

interface ListPartsParams {
  category?: PartCategory;
  status?: PartStatus;
  search?: string;
  page: number;
  pageSize: number;
}

export const partRepository = {
  async create(data: Pick<Part, 'name' | 'category' | 'sku' | 'status'>): Promise<Part> {
    return prisma.part.create({ data });
  },

  async findById(id: string): Promise<Part | null> {
    return prisma.part.findUnique({ where: { id } });
  },

  async findBySku(sku: string): Promise<Part | null> {
    return prisma.part.findUnique({ where: { sku } });
  },

  async list(params: ListPartsParams): Promise<{ items: Part[]; total: number }> {
    const where: Prisma.PartWhereInput = {
      ...(params.category ? { category: params.category } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.search
        ? {
            OR: [
              { name: { contains: params.search, mode: 'insensitive' } },
              { sku: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.part.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      prisma.part.count({ where }),
    ]);

    return { items, total };
  },

  async update(id: string, data: Partial<Pick<Part, 'name' | 'category' | 'status'>>): Promise<Part> {
    return prisma.part.update({ where: { id }, data });
  },

  async delete(id: string): Promise<Part> {
    return prisma.part.delete({ where: { id } });
  },

  async countConfigurationUsage(id: string): Promise<number> {
    return prisma.configurationPart.count({ where: { partId: id } });
  },
};
