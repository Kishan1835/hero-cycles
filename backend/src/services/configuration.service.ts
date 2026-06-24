import { configurationRepository } from '../repositories/configuration.repository';
import { partRepository } from '../repositories/part.repository';
import { NotFoundError, ConflictError, BadRequestError } from '../utils/errors';
import { CreateConfigurationInput, UpdateConfigurationInput } from '../validators/configuration.validator';
import { recordAudit } from './audit.service';

export const configurationService = {
  async create(input: CreateConfigurationInput, userId: string) {
    // Validate every referenced part exists before creating anything —
    // fail fast with a clear message instead of a partial DB write.
    const uniquePartIds = [...new Set(input.parts.map((p) => p.partId))];
    if (uniquePartIds.length !== input.parts.length) {
      throw new BadRequestError('Duplicate partId entries in configuration — use quantity instead');
    }

    const foundParts = await Promise.all(uniquePartIds.map((id) => partRepository.findById(id)));
    const missing = uniquePartIds.filter((id, idx) => !foundParts[idx]);
    if (missing.length > 0) {
      throw new BadRequestError(`Unknown part ID(s): ${missing.join(', ')}`);
    }

    try {
      const config = await configurationRepository.create({
        name: input.name,
        description: input.description,
        modelCode: input.modelCode,
        createdById: userId,
        parts: input.parts,
      });

      await recordAudit({
        userId,
        action: 'CREATE',
        entityType: 'BicycleConfiguration',
        entityId: config.id,
        metadata: { modelCode: config.modelCode, partCount: input.parts.length },
      });

      return config;
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictError(`A configuration with model code '${input.modelCode}' already exists`);
      }
      throw err;
    }
  },

  async getById(id: string) {
    const found = await configurationRepository.findById(id);
    if (!found) throw new NotFoundError('Bicycle configuration not found');
    return found;
  },

  async list(params: { isActive?: boolean; search?: string; page: number; pageSize: number }) {
    const { items, total } = await configurationRepository.list(params);
    return {
      items,
      pagination: {
        page: params.page,
        pageSize: params.pageSize,
        total,
        totalPages: Math.ceil(total / params.pageSize),
      },
    };
  },

  async update(id: string, input: UpdateConfigurationInput, userId: string) {
    await this.getById(id);
    const updated = await configurationRepository.update(id, input);
    await recordAudit({ userId, action: 'UPDATE', entityType: 'BicycleConfiguration', entityId: id, metadata: input });
    return updated;
  },

  async delete(id: string, userId: string) {
    await this.getById(id);
    await configurationRepository.delete(id);
    await recordAudit({ userId, action: 'DELETE', entityType: 'BicycleConfiguration', entityId: id });
  },

  async addPart(configId: string, partId: string, quantity: number, userId: string) {
    const config = await this.getById(configId);
    const part = await partRepository.findById(partId);
    if (!part) throw new NotFoundError('Part not found');
    if (config.parts.some((cp) => cp.partId === partId)) {
      throw new ConflictError('This part is already in the configuration — update its quantity instead');
    }

    await configurationRepository.addPart(configId, partId, quantity);
    await recordAudit({ userId, action: 'UPDATE', entityType: 'BicycleConfiguration', entityId: configId, metadata: { addedPart: partId, quantity } });
    return this.getById(configId);
  },

  async updatePartQuantity(configId: string, partId: string, quantity: number, userId: string) {
    const config = await this.getById(configId);
    if (!config.parts.some((cp) => cp.partId === partId)) {
      throw new NotFoundError('This part is not part of the configuration');
    }
    await configurationRepository.updatePartQuantity(configId, partId, quantity);
    await recordAudit({ userId, action: 'UPDATE', entityType: 'BicycleConfiguration', entityId: configId, metadata: { updatedPart: partId, quantity } });
    return this.getById(configId);
  },

  async removePart(configId: string, partId: string, userId: string) {
    const config = await this.getById(configId);
    if (!config.parts.some((cp) => cp.partId === partId)) {
      throw new NotFoundError('This part is not part of the configuration');
    }
    if (config.parts.length === 1) {
      throw new BadRequestError('Cannot remove the last remaining part — a configuration must have at least one part');
    }
    await configurationRepository.removePart(configId, partId);
    await recordAudit({ userId, action: 'UPDATE', entityType: 'BicycleConfiguration', entityId: configId, metadata: { removedPart: partId } });
    return this.getById(configId);
  },
};
