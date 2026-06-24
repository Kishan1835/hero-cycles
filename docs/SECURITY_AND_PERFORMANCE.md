# Security & Performance

## Section 15 — Security

- **JWT authentication.** Stateless bearer tokens signed with `JWT_SECRET`, expiring after `JWT_EXPIRES_IN` (default 8h). Tradeoff: a token can't be instantly revoked before it expires (no server-side denylist in this version), mitigated by a relatively short expiry and by `isActive` checks at login time. A production hardening step would add a token denylist or move to short-lived access tokens with refresh tokens.
- **Password hashing.** bcrypt with 12 salt rounds (`utils/password.ts`). Plaintext passwords are never logged or stored.
- **Authorization (RBAC).** Every mutating route is wrapped in `authorize(...roles)` middleware (`middleware/authorize.ts`), checked after `authenticate()`. Role checks happen at the route layer, not scattered through controllers, so the full set of who-can-do-what is auditable by reading the route files.
- **Input validation.** Every request body, query, and params object is validated against a Zod schema (`middleware/validate.ts`) before it reaches a controller. Invalid input never reaches business logic.
- **SQL injection prevention.** All database access goes through Prisma's parameterized query builder; there is no raw SQL string concatenation anywhere in the codebase.
- **Rate limiting.** A global limiter on `/api/*` (default 300 requests per 15 minutes) plus a tighter limiter specifically on `/api/auth/login` and `/api/auth/register` (20 requests per 15 minutes) to slow down credential-stuffing and brute-force attempts.
- **Audit logging.** Every create, update, delete, price change, and login is recorded with actor, action, entity, and timestamp (`services/audit.service.ts`). Failures to write an audit log are caught and logged but never block the underlying operation.
- **OWASP-aligned protections in place:**
  - Helmet sets secure HTTP headers by default.
  - CORS is restricted to a configured origin (`CORS_ORIGIN`), not wildcard.
  - Centralized error handling (`middleware/errorHandler.ts`) never leaks stack traces or internal error details in production (`NODE_ENV=production`).
  - Mass assignment is prevented by Zod schemas defining exactly which fields are accepted per endpoint; there's no `req.body` passed directly to Prisma anywhere.
  - Self-lockout prevention: an admin cannot deactivate or change the role of their own account via the API, enforced server-side, not just hidden in the UI.
- **Known limitations, documented rather than hidden:** no refresh-token rotation, no password-reset flow, no 2FA, no per-IP anomaly detection beyond basic rate limiting. All flagged as future enhancements rather than silently absent.

---

## Section 16 — Performance

- **Batched price lookups, not N+1.** The single most performance-critical query in the system, "what does this price out to," fetches the latest price for every component in one query (`priceRepository.getPricesAsOfForParts`) rather than querying per-part in a loop. This is the difference between O(1) and O(n) round trips for a configuration's price calculation.
- **Database indexing.** Composite index on `(partId, effectiveDate)` in `part_price_history` matches the exact lookup pattern used by both single-part and batched price queries. Indexes on `category`/`status` on `parts`, `modelCode` on configurations, and `(entityType, entityId)`/`createdAt` on `audit_logs` support the filtering and recent-activity queries the UI actually makes.
- **Pagination everywhere.** `/parts` and `/configurations` list endpoints are paginated (default 20, max 100 per page) so the system stays responsive as the catalog grows into the thousands, as the brief anticipates.
- **Query optimization patterns used:**
  - `Promise.all` for independent queries that don't depend on each other (e.g. dashboard KPIs fetch part count, config count, user count, and recent audits concurrently rather than sequentially).
  - Selective field projection (`select`) on the admin user list to avoid ever pulling `passwordHash` into application memory unnecessarily.
- **Caching on the frontend.** React Query caches all server-state with a 30-second stale time and disables refetch-on-window-focus, so navigating between already-visited pages doesn't trigger redundant network requests; mutations explicitly invalidate only the affected query keys.
- **Scalability strategy for growth beyond this version's scope:**
  - The stateless JWT auth model means the API can be horizontally scaled behind a load balancer with no sticky-session requirement.
  - Heavy read endpoints (parts list, dashboard summary) are natural candidates for a Redis cache layer if read volume grows much higher than write volume, not needed at the current scale, but the service-layer boundary makes it a contained addition later (cache in front of the repository call, not threaded through controllers).
  - If price-history tables grow very large over years of operation, partitioning `part_price_history` by date range would keep the "latest price as of X" index scan fast; not necessary at current projected scale but noted as the natural next lever.
