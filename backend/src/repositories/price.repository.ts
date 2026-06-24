import { PartPriceHistory } from '@prisma/client';
import { prisma } from '../config/prisma';

export const priceRepository = {
  async addPricePoint(data: {
    partId: string;
    cost: number;
    effectiveDate: Date;
    changedById: string;
    note?: string;
  }): Promise<PartPriceHistory> {
    return prisma.partPriceHistory.create({ data });
  },

  /**
   * Returns the price effective as of `asOfDate`: the most recent
   * price point whose effectiveDate is <= asOfDate. Returns null if
   * the part had no price on or before that date.
   */
  async getPriceAsOf(partId: string, asOfDate: Date): Promise<PartPriceHistory | null> {
    return prisma.partPriceHistory.findFirst({
      where: { partId, effectiveDate: { lte: asOfDate } },
      orderBy: { effectiveDate: 'desc' },
    });
  },

  /**
   * Batch version of getPriceAsOf for multiple parts at once — used
   * by the configuration price calculator to avoid N+1 queries.
   */
  async getPricesAsOfForParts(
    partIds: string[],
    asOfDate: Date
  ): Promise<Map<string, PartPriceHistory>> {
    if (partIds.length === 0) return new Map();

    // Fetch all candidate price points up to asOfDate for these parts,
    // then reduce to the latest per part in application code. This is
    // simpler and just as fast as a window-function query at this scale.
    const rows = await prisma.partPriceHistory.findMany({
      where: { partId: { in: partIds }, effectiveDate: { lte: asOfDate } },
      orderBy: { effectiveDate: 'desc' },
    });

    const latestByPartId = new Map<string, PartPriceHistory>();
    for (const row of rows) {
      if (!latestByPartId.has(row.partId)) {
        latestByPartId.set(row.partId, row);
      }
    }
    return latestByPartId;
  },

  async getHistory(partId: string, from?: Date, to?: Date): Promise<PartPriceHistory[]> {
    return prisma.partPriceHistory.findMany({
      where: {
        partId,
        ...(from || to
          ? {
              effectiveDate: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : {}),
      },
      orderBy: { effectiveDate: 'desc' },
      include: { changedBy: { select: { id: true, name: true, email: true } } },
    });
  },

  async findConflict(partId: string, effectiveDate: Date): Promise<PartPriceHistory | null> {
    return prisma.partPriceHistory.findUnique({
      where: { partId_effectiveDate: { partId, effectiveDate } },
    });
  },
};
