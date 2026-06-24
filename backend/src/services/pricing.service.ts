import { priceRepository } from '../repositories/price.repository';
import { partRepository } from '../repositories/part.repository';
import { configurationRepository } from '../repositories/configuration.repository';
import { NotFoundError, ConflictError, BadRequestError } from '../utils/errors';
import { AddPriceInput } from '../validators/pricing.validator';
import { recordAudit } from './audit.service';

export const pricingService = {
  async addPricePoint(partId: string, input: AddPriceInput, userId: string) {
    const part = await partRepository.findById(partId);
    if (!part) throw new NotFoundError('Part not found');

    const conflict = await priceRepository.findConflict(partId, input.effectiveDate);
    if (conflict) {
      throw new ConflictError(
        `A price for this part is already effective on ${input.effectiveDate.toISOString().slice(0, 10)}. Edit that entry instead of creating a duplicate.`
      );
    }

    const pricePoint = await priceRepository.addPricePoint({
      partId,
      cost: input.cost,
      effectiveDate: input.effectiveDate,
      changedById: userId,
      note: input.note,
    });

    await recordAudit({
      userId,
      action: 'PRICE_CHANGE',
      entityType: 'Part',
      entityId: partId,
      metadata: { cost: input.cost, effectiveDate: input.effectiveDate },
    });

    return pricePoint;
  },

  async getHistory(partId: string, from?: Date, to?: Date) {
    const part = await partRepository.findById(partId);
    if (!part) throw new NotFoundError('Part not found');
    return priceRepository.getHistory(partId, from, to);
  },

  /**
   * Returns the price of a single part as of a given date (defaults
   * to "now"). Throws if the part has no price point on or before
   * that date — i.e. the part didn't exist yet, pricing-wise.
   */
  async getPriceAsOf(partId: string, date: Date) {
    const part = await partRepository.findById(partId);
    if (!part) throw new NotFoundError('Part not found');

    const price = await priceRepository.getPriceAsOf(partId, date);
    if (!price) {
      throw new BadRequestError(
        `Part '${part.name}' has no recorded price on or before ${date.toISOString().slice(0, 10)}`
      );
    }
    return price;
  },

  /**
   * The core pricing engine: given a bicycle configuration, computes
   * the total cost and a per-component breakdown as of a given date.
   *
   * Algorithm:
   *  1. Load the configuration with its parts and quantities.
   *  2. Batch-fetch the latest price-as-of-date for every distinct part
   *     in one query (avoids N+1).
   *  3. For each component, lineTotal = unitCost * quantity.
   *  4. Sum line totals for the grand total.
   *
   * If any part lacks a price as of the target date, that part is
   * flagged in the breakdown with cost = null and excluded from the
   * total, rather than failing the whole calculation — a salesperson
   * should still see what *can* be priced.
   */
  async calculateConfigurationPrice(configurationId: string, asOfDate: Date) {
    const config = await configurationRepository.findById(configurationId);
    if (!config) throw new NotFoundError('Bicycle configuration not found');

    const partIds = config.parts.map((cp) => cp.partId);
    const priceMap = await priceRepository.getPricesAsOfForParts(partIds, asOfDate);

    let total = 0;
    let hasUnpricedComponents = false;

    const breakdown = config.parts.map((cp) => {
      const priceEntry = priceMap.get(cp.partId);
      const unitCost = priceEntry ? Number(priceEntry.cost) : null;
      const lineTotal = unitCost !== null ? unitCost * cp.quantity : null;

      if (lineTotal === null) hasUnpricedComponents = true;
      else total += lineTotal;

      return {
        partId: cp.part.id,
        partName: cp.part.name,
        category: cp.part.category,
        sku: cp.part.sku,
        quantity: cp.quantity,
        unitCost,
        lineTotal,
        priceEffectiveDate: priceEntry?.effectiveDate ?? null,
        priced: unitCost !== null,
      };
    });

    return {
      configurationId: config.id,
      configurationName: config.name,
      modelCode: config.modelCode,
      asOfDate,
      totalCost: total,
      hasUnpricedComponents,
      breakdown,
    };
  },

  /**
   * Convenience comparison: current price vs. price at an earlier date,
   * used by the "historical vs current cost" view in the dashboard.
   */
  async compareConfigurationPriceOverTime(configurationId: string, earlierDate: Date) {
    const [current, historical] = await Promise.all([
      this.calculateConfigurationPrice(configurationId, new Date()),
      this.calculateConfigurationPrice(configurationId, earlierDate),
    ]);

    return {
      current,
      historical,
      difference: current.totalCost - historical.totalCost,
      percentChange:
        historical.totalCost > 0
          ? ((current.totalCost - historical.totalCost) / historical.totalCost) * 100
          : null,
    };
  },
};
