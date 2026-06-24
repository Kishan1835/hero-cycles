# API Specification

## Section 8 — API Design

Base URL: `/api`. Full interactive docs are auto-served at `/api/docs` (Swagger UI) when the backend is running, generated from JSDoc comments on the route files (`src/routes/*.ts`) — this document is a human-readable companion to that.

All endpoints except `/auth/login`, `/auth/register`, and `/health` require a `Authorization: Bearer <token>` header.

---

### Authentication

#### `POST /api/auth/register`
Creates a new user account.

Request:
```json
{ "name": "Rahul Verma", "email": "sales@herocycles.com", "password": "Password123!", "role": "SALESPERSON" }
```
Response `201`:
```json
{ "token": "eyJhbGciOiJIUzI1NiIs...", "user": { "id": "...", "name": "Rahul Verma", "email": "sales@herocycles.com", "role": "SALESPERSON", "isActive": true } }
```
Error `409`: email already registered.

#### `POST /api/auth/login`
Request: `{ "email": "sales@herocycles.com", "password": "Password123!" }`
Response `200`: same shape as register.
Error `401`: wrong email/password. Error `403`: account deactivated.

#### `GET /api/auth/me`
Returns the authenticated user's identity from their token. `200` returns `{ "user": { "userId", "email", "role" } }`.

---

### Parts

#### `GET /api/parts`
Query params: `category`, `status`, `search`, `page` (default 1), `pageSize` (default 20, max 100).
Response `200`:
```json
{
  "items": [{ "id": "...", "name": "MRF Nylogrip Tyre 26 inch", "category": "TYRE", "status": "ACTIVE", "sku": "TYR-MRF-26" }],
  "pagination": { "page": 1, "pageSize": 20, "total": 15, "totalPages": 1 }
}
```

#### `GET /api/parts/:id`
Response `200`: single part. Error `404`: not found.

#### `POST /api/parts` — Pricing Manager / Admin only
Request:
```json
{ "name": "MRF Nylogrip Tyre 26 inch", "category": "TYRE", "sku": "TYR-MRF-26", "initialCost": 200, "effectiveDate": "2025-01-01" }
```
Response `201`: created part. Error `409`: SKU already exists. Error `403`: insufficient role.

#### `PATCH /api/parts/:id` — Pricing Manager / Admin only
Request (any subset): `{ "name": "...", "category": "TYRE", "status": "DISCONTINUED" }`
Response `200`: updated part.

#### `DELETE /api/parts/:id` — Admin only
Response `204`. Error `400`: part is used in N configuration(s) — must discontinue instead.

---

### Pricing

#### `GET /api/pricing/parts/:partId/history`
Query params: `from`, `to` (ISO dates, optional).
Response `200`: array of price points, newest first, each including `cost`, `effectiveDate`, `note`, `changedBy`.

#### `GET /api/pricing/parts/:partId/as-of`
Query param: `date` (default: today).
Response `200`: the single price point effective on that date. Error `400`: no price recorded on or before that date.

#### `POST /api/pricing/parts/:partId` — Pricing Manager / Admin only
Request: `{ "cost": 230, "effectiveDate": "2025-12-01", "note": "Q4 supplier increase" }`
Response `201`: new price point. Error `409`: a price already exists for that exact effective date.

#### `GET /api/pricing/configurations/:configId/calculate`
The core "instant pricing" endpoint. Query param: `date` (default: today).
Response `200`:
```json
{
  "configurationId": "...",
  "configurationName": "Hero Ranger Classic 26",
  "modelCode": "HC-CLASSIC-26",
  "asOfDate": "2025-12-15T00:00:00.000Z",
  "totalCost": 2260,
  "hasUnpricedComponents": false,
  "breakdown": [
    { "partId": "...", "partName": "Standard Steel Frame 26 inch", "category": "FRAME", "sku": "FRM-STD-26", "quantity": 1, "unitCost": 1800, "lineTotal": 1800, "priceEffectiveDate": "2025-07-01T00:00:00.000Z", "priced": true },
    { "partId": "...", "partName": "MRF Nylogrip Tyre 26 inch", "category": "TYRE", "sku": "TYR-MRF-26", "quantity": 2, "unitCost": 230, "lineTotal": 460, "priceEffectiveDate": "2025-12-01T00:00:00.000Z", "priced": true }
  ]
}
```

#### `GET /api/pricing/configurations/:configId/compare`
Query param: `date` (required) — compares current price vs. price on that date.
Response `200`: `{ "current": {...}, "historical": {...}, "difference": 60, "percentChange": 2.73 }`

---

### Bicycle Configurations

#### `GET /api/configurations`
Query params: `isActive`, `search`, `page`, `pageSize`. Response shape mirrors `/parts` pagination.

#### `GET /api/configurations/:id`
Full configuration with nested `parts[]` (each including the joined `Part`) and `createdBy`.

#### `POST /api/configurations`
Request:
```json
{
  "name": "Hero Sprint Sport 27.5",
  "modelCode": "HC-SPORT-275",
  "description": "Lightweight alloy-frame sport bicycle",
  "parts": [{ "partId": "...", "quantity": 1 }, { "partId": "...", "quantity": 2 }]
}
```
Response `201`: the created configuration. Error `400`: unknown part ID(s), or duplicate `partId` entries in the payload. Error `409`: model code already exists.

#### `PATCH /api/configurations/:id` — Pricing Manager / Admin only
Request (any subset): `{ "name": "...", "description": "...", "isActive": false }`

#### `DELETE /api/configurations/:id` — Admin only
`204` on success.

#### `POST /api/configurations/:id/parts`
Request: `{ "partId": "...", "quantity": 1 }`. Error `409`: part already in this configuration (use PATCH to change quantity instead).

#### `PATCH /api/configurations/:id/parts/:partId`
Request: `{ "quantity": 3 }`.

#### `DELETE /api/configurations/:id/parts/:partId`
Error `400`: cannot remove the last remaining part.

---

### Dashboard

#### `GET /api/dashboard/summary`
Response `200`:
```json
{
  "kpis": { "totalActiveParts": 15, "activeConfigurations": 2, "activeUsers": 3, "priceChangesLast30Days": 6 },
  "topConfigurations": [{ "id": "...", "name": "Hero Sprint Sport 27.5", "modelCode": "HC-SPORT-275", "partCount": 8, "totalCost": 6585 }],
  "recentActivity": [{ "id": "...", "action": "PRICE_CHANGE", "entityType": "Part", "entityId": "...", "actor": "Priya Sharma", "timestamp": "..." }]
}
```

---

### Admin (Admin only)

#### `GET /api/admin/users`
Response `200`: array of users (no `passwordHash`).

#### `PATCH /api/admin/users/:id/active`
Request: `{ "isActive": false }`. Error `400`: cannot deactivate your own account.

#### `PATCH /api/admin/users/:id/role`
Request: `{ "role": "PRICING_MANAGER" }`. Error `400`: cannot change your own role.

---

### Error response shape (consistent across all endpoints)
```json
{ "error": { "message": "Human-readable message", "code": "ErrorClassName", "details": { "field": "optional, e.g. Zod field errors" } } }
```

| HTTP Status | Meaning | Example |
|---|---|---|
| 400 | Bad request (business-rule violation) | "Cannot delete part, used in 3 configurations" |
| 401 | Unauthenticated | Missing/invalid/expired token |
| 403 | Forbidden | Wrong role for this action |
| 404 | Not found | Unknown part/config ID |
| 409 | Conflict | Duplicate SKU, duplicate effective date, duplicate model code |
| 422 | Validation failed | Malformed request body (Zod) |
| 429 | Rate limited | Too many login attempts |
| 500 | Internal server error | Unexpected failure (never leaks stack trace in production) |
