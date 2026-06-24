import { PartCategory, PartStatus } from '@prisma/client';
import { partRepository } from '../repositories/part.repository';
import { priceRepository } from '../repositories/price.repository';
import { ConflictError, NotFoundError, BadRequestError } from '../utils/errors';
import { CreatePartInput, ListPartsQuery, UpdatePartInput } from '../validators/part.validator';
import { recordAudit } from './audit.service';

export const partService = {
  async create(input: CreatePartInput, userId: string) {
    const existing = await partRepository.findBySku(input.sku);
    if (existing) {
      throw new ConflictError(`A part with SKU '${input.sku}' already exists`);
    }

    const part = await partRepository.create({
      name: input.name,
      category: input.category,
      sku: input.sku,
      status: input.status,
    });

    // Every part must have an initial price point — there is no such
    // thing as a part with no cost in this domain.
    await priceRepository.addPricePoint({
      partId: part.id,
      cost: input.initialCost,
      effectiveDate: input.effectiveDate,
      changedById: userId,
      note: 'Initial price on part creation',
    });

    await recordAudit({ userId, action: 'CREATE', entityType: 'Part', entityId: part.id, metadata: { sku: part.sku } });

    return part;
  },

  async getById(id: string) {
    const part = await partRepository.findById(id);
    if (!part) throw new NotFoundError('Part not found');
    return part;
  },

  async list(query: ListPartsQuery) {
    const { items, total } = await partRepository.list({
      category: query.category as PartCategory | undefined,
      status: query.status as PartStatus | undefined,
      search: query.search,
      page: query.page,
      pageSize: query.pageSize,
    });

    return {
      items,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    };
  },

  async update(id: string, input: UpdatePartInput, userId: string) {
    await this.getById(id); // throws NotFoundError if missing
    const updated = await partRepository.update(id, input);
    await recordAudit({ userId, action: 'UPDATE', entityType: 'Part', entityId: id, metadata: input });
    return updated;
  },

  async delete(id: string, userId: string) {
    await this.getById(id);

    const usageCount = await partRepository.countConfigurationUsage(id);
    if (usageCount > 0) {
      // Hard delete would silently break bicycle configurations that
      // reference this part. Force the caller to discontinue it instead.
      throw new BadRequestError(
        `Cannot delete part — it is used in ${usageCount} bicycle configuration(s). Set status to DISCONTINUED instead.`
      );
    }

    await partRepository.delete(id);
    await recordAudit({ userId, action: 'DELETE', entityType: 'Part', entityId: id });
  },
};
