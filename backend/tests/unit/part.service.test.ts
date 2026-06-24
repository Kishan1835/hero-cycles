import { partService } from '../../src/services/part.service';
import { partRepository } from '../../src/repositories/part.repository';
import { priceRepository } from '../../src/repositories/price.repository';
import { ConflictError, NotFoundError, BadRequestError } from '../../src/utils/errors';

jest.mock('../../src/repositories/part.repository');
jest.mock('../../src/repositories/price.repository');
jest.mock('../../src/services/audit.service', () => ({ recordAudit: jest.fn() }));

const mockedPartRepo = partRepository as jest.Mocked<typeof partRepository>;
const mockedPriceRepo = priceRepository as jest.Mocked<typeof priceRepository>;

describe('partService.create', () => {
  it('throws ConflictError when SKU already exists', async () => {
    mockedPartRepo.findBySku.mockResolvedValue({ id: 'existing' } as any);

    await expect(
      partService.create(
        { name: 'Tyre', category: 'TYRE', sku: 'TYR-1', status: 'ACTIVE', initialCost: 200, effectiveDate: new Date() } as any,
        'user-1'
      )
    ).rejects.toThrow(ConflictError);
  });

  it('creates the part and an initial price point together', async () => {
    mockedPartRepo.findBySku.mockResolvedValue(null);
    mockedPartRepo.create.mockResolvedValue({ id: 'part-1', sku: 'TYR-1' } as any);
    mockedPriceRepo.addPricePoint.mockResolvedValue({} as any);

    const result = await partService.create(
      { name: 'Tyre', category: 'TYRE', sku: 'TYR-1', status: 'ACTIVE', initialCost: 200, effectiveDate: new Date('2025-01-01') } as any,
      'user-1'
    );

    expect(result.id).toBe('part-1');
    expect(mockedPriceRepo.addPricePoint).toHaveBeenCalledWith(
      expect.objectContaining({ partId: 'part-1', cost: 200 })
    );
  });
});

describe('partService.delete', () => {
  it('throws NotFoundError when part does not exist', async () => {
    mockedPartRepo.findById.mockResolvedValue(null);
    await expect(partService.delete('missing-id', 'user-1')).rejects.toThrow(NotFoundError);
  });

  it('throws BadRequestError when the part is used in a configuration', async () => {
    mockedPartRepo.findById.mockResolvedValue({ id: 'part-1' } as any);
    mockedPartRepo.countConfigurationUsage.mockResolvedValue(3);

    await expect(partService.delete('part-1', 'user-1')).rejects.toThrow(BadRequestError);
    expect(mockedPartRepo.delete).not.toHaveBeenCalled();
  });

  it('deletes the part when it is not referenced anywhere', async () => {
    mockedPartRepo.findById.mockResolvedValue({ id: 'part-1' } as any);
    mockedPartRepo.countConfigurationUsage.mockResolvedValue(0);
    mockedPartRepo.delete.mockResolvedValue({ id: 'part-1' } as any);

    await partService.delete('part-1', 'user-1');
    expect(mockedPartRepo.delete).toHaveBeenCalledWith('part-1');
  });
});

describe('partService.list', () => {
  it('computes pagination metadata correctly', async () => {
    mockedPartRepo.list.mockResolvedValue({ items: [{ id: '1' }, { id: '2' }] as any, total: 45 });

    const result = await partService.list({ page: 2, pageSize: 20 } as any);

    expect(result.pagination).toEqual({ page: 2, pageSize: 20, total: 45, totalPages: 3 });
  });
});
