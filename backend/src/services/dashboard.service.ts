import { prisma } from '../config/prisma';
import { pricingService } from './pricing.service';

export const dashboardService = {
  async getSummary() {
    const [totalParts, activeConfigurations, totalUsers, recentPriceChanges, recentAudits] = await Promise.all([
      prisma.part.count({ where: { status: 'ACTIVE' } }),
      prisma.bicycleConfiguration.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.partPriceHistory.count({
        where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { user: { select: { name: true, email: true } } },
      }),
    ]);

    // "Popular" configurations approximated by part count (richer
    // configs = more complex/likely flagship models) since we don't
    // yet track sales/quote events. Documented as a known limitation.
    const topConfigurations = await prisma.bicycleConfiguration.findMany({
      where: { isActive: true },
      include: { _count: { select: { parts: true } } },
      orderBy: { parts: { _count: 'desc' } },
      take: 5,
    });

    const topConfigsWithPricing = await Promise.all(
      topConfigurations.map(async (c: (typeof topConfigurations)[number]) => {
        const pricing = await pricingService.calculateConfigurationPrice(c.id, new Date());
        return {
          id: c.id,
          name: c.name,
          modelCode: c.modelCode,
          partCount: c._count.parts,
          totalCost: pricing.totalCost,
        };
      })
    );

    return {
      kpis: {
        totalActiveParts: totalParts,
        activeConfigurations,
        activeUsers: totalUsers,
        priceChangesLast30Days: recentPriceChanges,
      },
      topConfigurations: topConfigsWithPricing,
      recentActivity: recentAudits.map((a: (typeof recentAudits)[number]) => ({
        id: a.id,
        action: a.action,
        entityType: a.entityType,
        entityId: a.entityId,
        actor: a.user?.name ?? 'System',
        timestamp: a.createdAt,
      })),
    };
  },
};
