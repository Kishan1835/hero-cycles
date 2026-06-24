import { configurationService } from '../../src/services/configuration.service';
import { configurationRepository } from '../../src/repositories/configuration.repository';
import { partRepository } from '../../src/repositories/part.repository';
import { BadRequestError, ConflictError, NotFoundError } from '../../src/utils/errors';

jest.mock('../../src/repositories/configuration.repository');
jest.mock('../../src/repositories/part.repository');
jest.mock('../../src/services/audit.service', () => ({ recordAudit: jest.fn() }));

const mockedConfigRepo = configurationRepository as jest.Mocked<typeof configurationRepository>;
const mockedPartRepo = partRepository as jest.Mocked<typeof partRepository>;

describe('configurationService.create', () => {
  it('rejects duplicate partId entries in the same payload', async () => {
    await expect(
      configurationService.create(
        {
          name: 'X',
          modelCode: 'X-1',
          parts: [
            { partId: 'p1', quantity: 1 },
            { partId: 'p1', quantity: 2 },
          ],
        } as any,
        'user-1'
      )
    ).rejects.toThrow(BadRequestError);
  });

  it('rejects unknown part IDs', async () => {
    mockedPartRepo.findById.mockResolvedValue(null);

    await expect(
      configurationService.create(
        { name: 'X', modelCode: 'X-1', parts: [{ partId: 'ghost-part', quantity: 1 }] } as any,
        'user-1'
      )
    ).rejects.toThrow(BadRequestError);
  });

  it('throws ConflictError on duplicate modelCode (P2002)', async () => {
    mockedPartRepo.findById.mockResolvedValue({ id: 'p1' } as any);
    mockedConfigRepo.create.mockRejectedValue({ code: 'P2002' });

    await expect(
      configurationService.create(
        { name: 'X', modelCode: 'DUPLICATE', parts: [{ partId: 'p1', quantity: 1 }] } as any,
        'user-1'
      )
    ).rejects.toThrow(ConflictError);
  });

  it('creates the configuration when all parts are valid', async () => {
    mockedPartRepo.findById.mockResolvedValue({ id: 'p1' } as any);
    mockedConfigRepo.create.mockResolvedValue({ id: 'config-1', modelCode: 'X-1' } as any);

    const result = await configurationService.create(
      { name: 'X', modelCode: 'X-1', parts: [{ partId: 'p1', quantity: 1 }] } as any,
      'user-1'
    );

    expect(result.id).toBe('config-1');
  });
});

describe('configurationService.removePart', () => {
  it('throws BadRequestError when removing the last part', async () => {
    mockedConfigRepo.findById.mockResolvedValue({
      id: 'config-1',
      parts: [{ partId: 'only-part' }],
    } as any);

    await expect(configurationService.removePart('config-1', 'only-part', 'user-1')).rejects.toThrow(
      BadRequestError
    );
  });

  it('throws NotFoundError when the part is not in the configuration', async () => {
    mockedConfigRepo.findById.mockResolvedValue({
      id: 'config-1',
      parts: [{ partId: 'p1' }, { partId: 'p2' }],
    } as any);

    await expect(configurationService.removePart('config-1', 'not-in-config', 'user-1')).rejects.toThrow(
      NotFoundError
    );
  });

  it('removes the part when more than one part remains', async () => {
    mockedConfigRepo.findById
      .mockResolvedValueOnce({ id: 'config-1', parts: [{ partId: 'p1' }, { partId: 'p2' }] } as any)
      .mockResolvedValueOnce({ id: 'config-1', parts: [{ partId: 'p2' }] } as any);

    const result = await configurationService.removePart('config-1', 'p1', 'user-1');
    expect(mockedConfigRepo.removePart).toHaveBeenCalledWith('config-1', 'p1');
    expect(result.parts).toHaveLength(1);
  });
});

describe('configurationService.addPart', () => {
  it('throws ConflictError if the part is already in the configuration', async () => {
    mockedConfigRepo.findById.mockResolvedValue({
      id: 'config-1',
      parts: [{ partId: 'p1' }],
    } as any);
    mockedPartRepo.findById.mockResolvedValue({ id: 'p1' } as any);

    await expect(configurationService.addPart('config-1', 'p1', 1, 'user-1')).rejects.toThrow(
      ConflictError
    );
  });
});
