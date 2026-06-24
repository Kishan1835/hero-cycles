export type Role = 'ADMIN' | 'PRICING_MANAGER' | 'SALESPERSON';

export type PartCategory =
  | 'FRAME'
  | 'GEAR_SET'
  | 'TYRE'
  | 'BRAKE'
  | 'SEAT'
  | 'HANDLEBAR'
  | 'CHAIN'
  | 'PEDAL'
  | 'OTHER';

export type PartStatus = 'ACTIVE' | 'DISCONTINUED' | 'DRAFT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface Part {
  id: string;
  name: string;
  category: PartCategory;
  status: PartStatus;
  sku: string;
  createdAt: string;
  updatedAt: string;
}

export interface PricePoint {
  id: string;
  partId: string;
  cost: string | number;
  effectiveDate: string;
  note?: string | null;
  changedBy?: { id: string; name: string; email: string };
}

export interface ConfigurationPart {
  id: string;
  partId: string;
  quantity: number;
  part: Part;
}

export interface BicycleConfiguration {
  id: string;
  name: string;
  description?: string | null;
  modelCode: string;
  isActive: boolean;
  createdAt: string;
  createdBy: { id: string; name: string; email: string };
  parts: ConfigurationPart[];
}

export interface PriceBreakdownLine {
  partId: string;
  partName: string;
  category: PartCategory;
  sku: string;
  quantity: number;
  unitCost: number | null;
  lineTotal: number | null;
  priceEffectiveDate: string | null;
  priced: boolean;
}

export interface ConfigurationPriceResult {
  configurationId: string;
  configurationName: string;
  modelCode: string;
  asOfDate: string;
  totalCost: number;
  hasUnpricedComponents: boolean;
  breakdown: PriceBreakdownLine[];
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface DashboardSummary {
  kpis: {
    totalActiveParts: number;
    activeConfigurations: number;
    activeUsers: number;
    priceChangesLast30Days: number;
  };
  topConfigurations: { id: string; name: string; modelCode: string; partCount: number; totalCost: number }[];
  recentActivity: {
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    actor: string;
    timestamp: string;
  }[];
}

export interface ApiError {
  error: { message: string; code: string; details?: unknown };
}
