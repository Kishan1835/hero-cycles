# Database Design

## Section 7 — Database Design

Full source of truth: `backend/prisma/schema.prisma`. This doc explains the reasoning; the schema file is authoritative for exact types/constraints.

### `users`
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| name | string | |
| email | string, unique, indexed | login identifier |
| passwordHash | string | bcrypt, 12 salt rounds |
| role | enum (ADMIN, PRICING_MANAGER, SALESPERSON) | default SALESPERSON |
| isActive | boolean | default true; deactivation instead of delete |
| createdAt / updatedAt | datetime | |

### `parts`
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| name | string | |
| category | enum (FRAME, GEAR_SET, TYRE, BRAKE, SEAT, HANDLEBAR, CHAIN, PEDAL, OTHER), indexed | |
| status | enum (ACTIVE, DISCONTINUED, DRAFT), indexed | |
| sku | string, unique | manufacturing identifier |
| createdAt / updatedAt | datetime | |

Note: **cost is intentionally not a column on `parts`.** Cost lives entirely in `part_price_history` — this is the core design decision that makes historical pricing possible.

### `part_price_history`
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| partId | uuid, FK → parts, cascade delete | |
| cost | decimal(10,2) | |
| effectiveDate | datetime | |
| changedById | uuid, FK → users | who recorded this price |
| note | string, nullable | optional context ("Q4 supplier increase") |
| createdAt | datetime | when the row was inserted (audit purposes; distinct from effectiveDate) |

**Constraints**: `UNIQUE(partId, effectiveDate)` — prevents two ambiguous prices on the same date for the same part.
**Index**: `(partId, effectiveDate)` — the lookup pattern is always "latest price for this part as of this date," so this composite index makes that a fast indexed scan rather than a full table scan.

### `bicycle_configurations`
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| name | string | |
| description | string, nullable | |
| modelCode | string, unique, indexed | |
| isActive | boolean | default true |
| createdById | uuid, FK → users | |
| createdAt / updatedAt | datetime | |

### `configuration_parts` (join table)
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| configurationId | uuid, FK → bicycle_configurations, cascade delete | |
| partId | uuid, FK → parts | |
| quantity | int | default 1 |

**Constraint**: `UNIQUE(configurationId, partId)` — a part appears at most once per configuration; multiple units are expressed via `quantity`, not duplicate rows.

### `audit_logs`
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| userId | uuid, FK → users, nullable, SetNull on delete | nullable so a user being removed doesn't orphan/delete their audit trail |
| action | enum (CREATE, UPDATE, DELETE, PRICE_CHANGE, LOGIN) | |
| entityType | string, indexed (with entityId) | e.g. "Part", "BicycleConfiguration" |
| entityId | string, nullable | |
| metadata | json, nullable | action-specific context |
| createdAt | datetime, indexed | for chronological queries (dashboard "recent activity") |

### Relationships summary
- One `User` creates many `BicycleConfiguration`s, records many `PartPriceHistory` entries, and performs many `AuditLog` entries.
- One `Part` has many `PartPriceHistory` entries and appears in many `ConfigurationPart` rows (many-to-many with `BicycleConfiguration` through that join table).
- One `BicycleConfiguration` has many `ConfigurationPart` rows.

### Why this shape avoids the Excel problem directly
The Excel sheet's core flaw is that "cost" is a single mutable cell. Here, cost is never a single cell — it's a queryable history. The unique constraint on `(partId, effectiveDate)` and the indexed lookup pattern are what turn "what did this cost in January" from a manual search into an O(log n) indexed query.
