import { PrismaClient, Role, PartCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Users ─────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Password123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@herocycles.com' },
    update: {},
    create: { name: 'Anil Mehta', email: 'admin@herocycles.com', passwordHash, role: Role.ADMIN },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@herocycles.com' },
    update: {},
    create: { name: 'Priya Sharma', email: 'manager@herocycles.com', passwordHash, role: Role.PRICING_MANAGER },
  });

  const sales = await prisma.user.upsert({
    where: { email: 'sales@herocycles.com' },
    update: {},
    create: { name: 'Rahul Verma', email: 'sales@herocycles.com', passwordHash, role: Role.SALESPERSON },
  });

  console.log('✓ Users created:', { admin: admin.email, manager: manager.email, sales: sales.email });

  // ── Parts ─────────────────────────────────────────────
  const partsData = [
    { name: 'Standard Steel Frame 26"', category: PartCategory.FRAME, sku: 'FRM-STD-26' },
    { name: 'Alloy Frame 27.5" Sport', category: PartCategory.FRAME, sku: 'FRM-ALY-275' },
    { name: '7-Speed Shimano Gear Set', category: PartCategory.GEAR_SET, sku: 'GR-SHM-7SP' },
    { name: 'Single Speed Gear Set', category: PartCategory.GEAR_SET, sku: 'GR-SS-1SP' },
    { name: 'MRF Nylogrip Tyre 26"', category: PartCategory.TYRE, sku: 'TYR-MRF-26' },
    { name: 'CEAT All-Terrain Tyre 27.5"', category: PartCategory.TYRE, sku: 'TYR-CEAT-275' },
    { name: 'Dual Disc Brake Set', category: PartCategory.BRAKE, sku: 'BRK-DISC-DUAL' },
    { name: 'Standard V-Brake Set', category: PartCategory.BRAKE, sku: 'BRK-V-STD' },
    { name: 'Cushioned Vinyl Seat', category: PartCategory.SEAT, sku: 'SEAT-VNL-CSH' },
    { name: 'Sport Gel Seat', category: PartCategory.SEAT, sku: 'SEAT-GEL-SPT' },
    { name: 'Straight Alloy Handlebar', category: PartCategory.HANDLEBAR, sku: 'HBR-ALY-STR' },
    { name: 'Riser MTB Handlebar', category: PartCategory.HANDLEBAR, sku: 'HBR-MTB-RSR' },
    { name: 'Standard Roller Chain', category: PartCategory.CHAIN, sku: 'CHN-STD-ROL' },
    { name: 'Reinforced MTB Chain', category: PartCategory.CHAIN, sku: 'CHN-MTB-REIN' },
    { name: 'Alloy Platform Pedals', category: PartCategory.PEDAL, sku: 'PED-ALY-PLT' },
  ];

  const parts: Record<string, string> = {};

  for (const p of partsData) {
    const part = await prisma.part.upsert({
      where: { sku: p.sku },
      update: {},
      create: { name: p.name, category: p.category, sku: p.sku, status: 'ACTIVE' },
    });
    parts[p.sku] = part.id;
  }

  console.log(`✓ ${partsData.length} parts created`);

  // ── Price history (demonstrates the Jan ₹200 → Dec ₹230 example) ──
  const priceSeed: { sku: string; cost: number; effectiveDate: string }[] = [
    // Tyre example from the assignment brief
    { sku: 'TYR-MRF-26', cost: 200, effectiveDate: '2025-01-01' },
    { sku: 'TYR-MRF-26', cost: 210, effectiveDate: '2025-06-01' },
    { sku: 'TYR-MRF-26', cost: 230, effectiveDate: '2025-12-01' },

    { sku: 'TYR-CEAT-275', cost: 280, effectiveDate: '2025-01-01' },
    { sku: 'TYR-CEAT-275', cost: 305, effectiveDate: '2025-09-01' },

    { sku: 'FRM-STD-26', cost: 1800, effectiveDate: '2025-01-01' },
    { sku: 'FRM-STD-26', cost: 1950, effectiveDate: '2025-07-01' },

    { sku: 'FRM-ALY-275', cost: 3200, effectiveDate: '2025-01-01' },
    { sku: 'FRM-ALY-275', cost: 3450, effectiveDate: '2025-08-01' },

    { sku: 'GR-SHM-7SP', cost: 950, effectiveDate: '2025-01-01' },
    { sku: 'GR-SS-1SP', cost: 320, effectiveDate: '2025-01-01' },

    { sku: 'BRK-DISC-DUAL', cost: 650, effectiveDate: '2025-01-01' },
    { sku: 'BRK-DISC-DUAL', cost: 690, effectiveDate: '2025-10-01' },
    { sku: 'BRK-V-STD', cost: 220, effectiveDate: '2025-01-01' },

    { sku: 'SEAT-VNL-CSH', cost: 180, effectiveDate: '2025-01-01' },
    { sku: 'SEAT-GEL-SPT', cost: 340, effectiveDate: '2025-01-01' },

    { sku: 'HBR-ALY-STR', cost: 210, effectiveDate: '2025-01-01' },
    { sku: 'HBR-MTB-RSR', cost: 260, effectiveDate: '2025-01-01' },

    { sku: 'CHN-STD-ROL', cost: 150, effectiveDate: '2025-01-01' },
    { sku: 'CHN-MTB-REIN', cost: 240, effectiveDate: '2025-01-01' },

    { sku: 'PED-ALY-PLT', cost: 190, effectiveDate: '2025-01-01' },
  ];

  for (const p of priceSeed) {
    const partId = parts[p.sku];
    await prisma.partPriceHistory.upsert({
      where: { partId_effectiveDate: { partId, effectiveDate: new Date(p.effectiveDate) } },
      update: {},
      create: {
        partId,
        cost: p.cost,
        effectiveDate: new Date(p.effectiveDate),
        changedById: manager.id,
        note: 'Seed data',
      },
    });
  }

  console.log(`✓ ${priceSeed.length} price history entries created`);

  // ── Bicycle Configurations ───────────────────────────
  const sport27 = await prisma.bicycleConfiguration.upsert({
    where: { modelCode: 'HC-SPORT-275' },
    update: {},
    create: {
      name: 'Hero Sprint Sport 27.5',
      description: 'Lightweight alloy-frame sport bicycle with disc brakes',
      modelCode: 'HC-SPORT-275',
      createdById: sales.id,
      parts: {
        create: [
          { partId: parts['FRM-ALY-275'], quantity: 1 },
          { partId: parts['GR-SHM-7SP'], quantity: 1 },
          { partId: parts['TYR-CEAT-275'], quantity: 2 },
          { partId: parts['BRK-DISC-DUAL'], quantity: 1 },
          { partId: parts['SEAT-GEL-SPT'], quantity: 1 },
          { partId: parts['HBR-MTB-RSR'], quantity: 1 },
          { partId: parts['CHN-MTB-REIN'], quantity: 1 },
          { partId: parts['PED-ALY-PLT'], quantity: 1 },
        ],
      },
    },
  });

  const classic26 = await prisma.bicycleConfiguration.upsert({
    where: { modelCode: 'HC-CLASSIC-26' },
    update: {},
    create: {
      name: 'Hero Ranger Classic 26',
      description: 'Everyday city commuter bicycle, single-speed',
      modelCode: 'HC-CLASSIC-26',
      createdById: sales.id,
      parts: {
        create: [
          { partId: parts['FRM-STD-26'], quantity: 1 },
          { partId: parts['GR-SS-1SP'], quantity: 1 },
          { partId: parts['TYR-MRF-26'], quantity: 2 },
          { partId: parts['BRK-V-STD'], quantity: 1 },
          { partId: parts['SEAT-VNL-CSH'], quantity: 1 },
          { partId: parts['HBR-ALY-STR'], quantity: 1 },
          { partId: parts['CHN-STD-ROL'], quantity: 1 },
        ],
      },
    },
  });

  console.log('✓ Bicycle configurations created:', sport27.modelCode, classic26.modelCode);

  console.log('🌱 Seed complete.');
  console.log('\nDemo credentials (all use password: Password123!)');
  console.log('  Admin:           admin@herocycles.com');
  console.log('  Pricing Manager: manager@herocycles.com');
  console.log('  Salesperson:     sales@herocycles.com');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
