import { pricingService } from '../../src/services/pricing.service';
import { priceRepository } from '../../src/repositories/price.repository';
import { partRepository } from '../../src/repositories/part.repository';
import { configurationRepository } from '../../src/repositories/configuration.repository';
import { NotFoundError, BadRequestError, ConflictError } from '../../src/utils/errors';

jest.mock('../../src/repositories/price.repository');
jest.mock('../../src/repositories/part.repository');
jest.mock('../../src/repositories/configuration.repository');
jest.mock('../../src/services/audit.service', () => ({ recordAudit: jest.fn() }));

const mockedPriceRepo = priceRepository as jest.Mocked<typeof priceRepository>;
const mockedPartRepo = partRepository as jest.Mocked<typeof partRepository>;
const mockedConfigRepo = configurationRepository as jest.Mocked<typeof configurationRepository>;

describe('pricingService.addPricePoint', () => {
  it('throws NotFoundError if the part does not exist', async () => {
    mockedPartRepo.findById.mockResolvedValue(null);

    await expect(
      pricingService.addPricePoint('part-1', { cost: 200, effectiveDate: new Date() } as any, 'user-1')
    ).rejects.toThrow(NotFoundError);
  });

  it('throws ConflictError when a price already exists for that exact effective date', async () => {
    mockedPartRepo.findById.mockResolvedValue({ id: 'part-1', name: 'Tyre' } as any);
    mockedPriceRepo.findConflict.mockResolvedValue({ id: 'existing' } as any);

    await expect(
      pricingService.addPricePoint(
        'part-1',
        { cost: 230, effectiveDate: new Date('2025-12-01') } as any,
        'user-1'
      )
    ).rejects.toThrow(ConflictError);
  });

  it('creates a new price point when no conflict exists', async () => {
    mockedPartRepo.findById.mockResolvedValue({ id: 'part-1', name: 'Tyre' } as any);
    mockedPriceRepo.findConflict.mockResolvedValue(null);
    mockedPriceRepo.addPricePoint.mockResolvedValue({ id: 'price-1', cost: 230 } as any);

    const result = await pricingService.addPricePoint(
      'part-1',
      { cost: 230, effectiveDate: new Date('2025-12-01') } as any,
      'user-1'
    );

    expect(result).toEqual({ id: 'price-1', cost: 230 });
    expect(mockedPriceRepo.addPricePoint).toHaveBeenCalledWith(
      expect.objectContaining({ partId: 'part-1', cost: 230 })
    );
  });
});

describe('pricingService.getPriceAsOf', () => {
  it('throws BadRequestError when the part has no price before the requested date', async () => {
    mockedPartRepo.findById.mockResolvedValue({ id: 'part-1', name: 'Tyre' } as any);
    mockedPriceRepo.getPriceAsOf.mockResolvedValue(null);

    await expect(pricingService.getPriceAsOf('part-1', new Date('2020-01-01'))).rejects.toThrow(
      BadRequestError
    );
  });

  it('returns the correct historical price point — Hero Cycles tyre example (Jan ₹200 → Dec ₹230)', async () => {
    mockedPartRepo.findById.mockResolvedValue({ id: 'tyre-1', name: 'MRF Tyre' } as any);

    mockedPriceRepo.getPriceAsOf.mockImplementation(async (_partId, asOf) => {
      if (asOf < new Date('2025-12-01')) {
        return { id: 'jan', cost: 200, effectiveDate: new Date('2025-01-01') } as any;
      }
      return { id: 'dec', cost: 230, effectiveDate: new Date('2025-12-01') } as any;
    });

    const januaryPrice = await pricingService.getPriceAsOf('tyre-1', new Date('2025-03-15'));
    const decemberPrice = await pricingService.getPriceAsOf('tyre-1', new Date('2025-12-15'));

    expect(Number(januaryPrice.cost)).toBe(200);
    expect(Number(decemberPrice.cost)).toBe(230);
  });
});

describe('pricingService.calculateConfigurationPrice', () => {
  it('throws NotFoundError when the configuration does not exist', async () => {
    mockedConfigRepo.findById.mockResolvedValue(null);
    await expect(
      pricingService.calculateConfigurationPrice('config-1', new Date())
    ).rejects.toThrow(NotFoundError);
  });

  it('computes total cost as the sum of unitCost * quantity across all parts', async () => {
    mockedConfigRepo.findById.mockResolvedValue({
      id: 'config-1',
      name: 'Hero Ranger Classic 26',
      modelCode: 'HC-CLASSIC-26',
      parts: [
        { partId: 'frame-1', quantity: 1, part: { id: 'frame-1', name: 'Steel Frame', category: 'FRAME', sku: 'FRM-1' } },
        { partId: 'tyre-1', quantity: 2, part: { id: 'tyre-1', name: 'MRF Tyre', category: 'TYRE', sku: 'TYR-1' } },
      ],
    } as any);

    mockedPriceRepo.getPricesAsOfForParts.mockResolvedValue(
      new Map([
        ['frame-1', { cost: 1800, effectiveDate: new Date('2025-01-01') } as any],
        ['tyre-1', { cost: 230, effectiveDate: new Date('2025-12-01') } as any],
      ])
    );

    const result = await pricingService.calculateConfigurationPrice('config-1', new Date());

    // 1800 * 1 + 230 * 2 = 2260
    expect(result.totalCost).toBe(2260);
    expect(result.hasUnpricedComponents).toBe(false);
    expect(result.breakdown).toHaveLength(2);
    expect(result.breakdown.find((b: { partId: string }) => b.partId === 'tyre-1')?.lineTotal).toBe(460);
  });

  it('flags components with no price as of the given date and excludes them from the total', async () => {
    mockedConfigRepo.findById.mockResolvedValue({
      id: 'config-1',
      name: 'Test Config',
      modelCode: 'TEST-1',
      parts: [
        { partId: 'frame-1', quantity: 1, part: { id: 'frame-1', name: 'Frame', category: 'FRAME', sku: 'FRM-1' } },
        { partId: 'new-part', quantity: 1, part: { id: 'new-part', name: 'New Part', category: 'OTHER', sku: 'NEW-1' } },
      ],
    } as any);

    // 'new-part' has no price point before this early date
    mockedPriceRepo.getPricesAsOfForParts.mockResolvedValue(
      new Map([['frame-1', { cost: 1800, effectiveDate: new Date('2025-01-01') } as any]])
    );

    const result = await pricingService.calculateConfigurationPrice('config-1', new Date('2025-02-01'));

    expect(result.totalCost).toBe(1800);
    expect(result.hasUnpricedComponents).toBe(true);
    const unpriced = result.breakdown.find((b: { partId: string }) => b.partId === 'new-part');
    expect(unpriced?.priced).toBe(false);
    expect(unpriced?.lineTotal).toBeNull();
  });

  it('correctly multiplies unit cost by quantity for multi-unit components (e.g. 2 tyres)', async () => {
    mockedConfigRepo.findById.mockResolvedValue({
      id: 'config-1',
      name: 'Test',
      modelCode: 'T-1',
      parts: [
        { partId: 'tyre-1', quantity: 2, part: { id: 'tyre-1', name: 'Tyre', category: 'TYRE', sku: 'TYR-1' } },
      ],
    } as any);

    mockedPriceRepo.getPricesAsOfForParts.mockResolvedValue(
      new Map([['tyre-1', { cost: 200, effectiveDate: new Date('2025-01-01') } as any]])
    );

    const result = await pricingService.calculateConfigurationPrice('config-1', new Date());
    expect(result.breakdown[0].lineTotal).toBe(400);
    expect(result.totalCost).toBe(400);
  });
});

describe('pricingService.compareConfigurationPriceOverTime', () => {
  it('computes a positive percent change when current price is higher than historical', async () => {
    mockedConfigRepo.findById.mockResolvedValue({
      id: 'config-1',
      name: 'Test',
      modelCode: 'T-1',
      parts: [{ partId: 'tyre-1', quantity: 1, part: { id: 'tyre-1', name: 'Tyre', category: 'TYRE', sku: 'TYR-1' } }],
    } as any);

    mockedPriceRepo.getPricesAsOfForParts
      .mockResolvedValueOnce(new Map([['tyre-1', { cost: 230, effectiveDate: new Date('2025-12-01') } as any]])) // current
      .mockResolvedValueOnce(new Map([['tyre-1', { cost: 200, effectiveDate: new Date('2025-01-01') } as any]])); // historical

    const result = await pricingService.compareConfigurationPriceOverTime('config-1', new Date('2025-01-15'));

    expect(result.current.totalCost).toBe(230);
    expect(result.historical.totalCost).toBe(200);
    expect(result.difference).toBe(30);
    expect(result.percentChange).toBeCloseTo(15);
  });
});
