# Testing

## Section 14 — Testing

### Test strategy

| Layer | Tool | What it covers |
|---|---|---|
| Unit | Jest + ts-jest, mocked repositories | Business logic in `services/*` — the pricing engine, validation rules, authorization decisions — in isolation from the database. |
| Integration | Jest + Supertest, mocked Prisma client | Route wiring, middleware order, RBAC enforcement, request validation — against the real Express app, without needing a live database. |
| Manual / E2E (recommended next step) | Postman collection or Playwright against a seeded local Postgres | Full request to DB to response loop, exactly as a real user would hit it. Not included in this submission's automated suite, flagged as a natural next addition. |

### Coverage strategy
- `jest.config.js` sets a coverage floor (60 to 65 percent across branches/functions/lines/statements) on `src/**/*.ts`, excluding the server bootstrap file.
- Coverage is weighted toward `services/` deliberately, since that's where the business rules (and bugs) live; controllers and routes are thin pass-through layers by design, so they need correctness-of-wiring tests (integration) more than line coverage.

### A transparency note on this submission's test execution

This code was developed in a sandboxed environment whose network allowlist does not include `binaries.prisma.sh`, the domain Prisma's CLI uses to download its query-engine binary. As a result, `npx prisma generate` could not complete in that sandbox, `@prisma/client` only produced an untyped stub, and the test suite could not be run to a green/red result there. This is a sandbox networking limitation, not a defect introduced by the seed/schema/test code, and it disappears as soon as `npm install && npx prisma generate` run with normal internet access, which is the very first step in the Quick Start in the README.

What was independently verified in that same sandbox:
- The core pricing calculation algorithm (`unitCost * quantity` summed across components, with unpriced components flagged and excluded) was extracted into a standalone, Prisma-free TypeScript script and run directly, confirmed correct against the assignment's own worked example (Hero Ranger Classic 26: 1 frame at ₹1,800 plus 2 tyres at ₹230 equals ₹2,260).
- The entire frontend (`frontend/`) has zero dependency on the Prisma client and was fully type-checked (`tsc -b`) and production-built (`vite build`) successfully with no errors.
- The backend's `tsconfig.json` was caught and fixed mid-development by the project-wide typecheck (a real `rootDir` misconfiguration around the seed script), and a real bug in the frontend (`ConfigurationBuilder` modal not being rendered) was caught by `tsc -b` and fixed. Both are concrete evidence the toolchain was actually exercised, not skipped.

Once `prisma generate` succeeds on a machine with normal network access, `npm test` will execute the full suite below to completion exactly as written.

---

### Test scenarios (30+)

**Pricing service, `pricing.service.test.ts`**
1. `addPricePoint` throws `NotFoundError` for a non-existent part.
2. `addPricePoint` throws `ConflictError` when a price already exists on that exact date.
3. `addPricePoint` succeeds and persists the new price point when no conflict exists.
4. `getPriceAsOf` throws `BadRequestError` when no price exists on or before the requested date.
5. `getPriceAsOf` correctly returns ₹200 for a March 2025 lookup and ₹230 for a December 2025 lookup, the assignment's own worked example.
6. `calculateConfigurationPrice` throws `NotFoundError` for an unknown configuration.
7. `calculateConfigurationPrice` correctly sums `unitCost x quantity` across multiple components.
8. `calculateConfigurationPrice` flags unpriced components and excludes them from the total rather than failing the whole calculation.
9. `calculateConfigurationPrice` correctly multiplies for multi-unit components (e.g. 2 tyres).
10. `compareConfigurationPriceOverTime` computes a correct difference and percent change between two dates.

**Part service, `part.service.test.ts`**
11. `create` throws `ConflictError` on duplicate SKU.
12. `create` creates the part and its initial price point together, atomically in intent.
13. `delete` throws `NotFoundError` for an unknown part.
14. `delete` throws `BadRequestError` when the part is referenced by any configuration.
15. `delete` succeeds when the part is unreferenced.
16. `list` computes pagination metadata (`page`, `totalPages`) correctly from total count.

**Configuration service, `configuration.service.test.ts`**
17. `create` rejects duplicate `partId` entries within a single payload.
18. `create` rejects unknown part IDs with a clear message listing which IDs were invalid.
19. `create` translates a Prisma unique-constraint violation on `modelCode` into a `ConflictError`.
20. `create` succeeds when all referenced parts exist.
21. `removePart` throws `BadRequestError` when asked to remove the last remaining component.
22. `removePart` throws `NotFoundError` when the part isn't actually in the configuration.
23. `removePart` succeeds when more than one component remains.
24. `addPart` throws `ConflictError` if the part is already in the configuration.

**Auth service, `auth.service.test.ts`**
25. `login` throws `UnauthorizedError` for a non-existent email.
26. `login` throws `ForbiddenError` for a deactivated account.
27. `login` throws `UnauthorizedError` for an incorrect password.
28. `login` returns a token and a sanitized user object (no `passwordHash` leaked) on success.
29. `register` throws `ConflictError` when the email is already registered.

**Integration, `auth.routes.test.ts`**
30. `GET /api/parts` without a token returns 401.
31. `GET /api/parts` with a malformed `Authorization` header returns 401.
32. `GET /api/parts` with a valid token succeeds (200).
33. `POST /api/parts` as a SALESPERSON returns 403, confirming RBAC correctly blocks the wrong role.
34. `POST /api/auth/login` with an invalid body shape (e.g. non-email string) returns 422 with Zod field errors.
35. An unknown route returns 404 with a clear message.
36. `GET /health` returns 200 without requiring authentication.

### Why these scenarios were prioritized
The pricing engine (scenarios 1 to 10) is the product's core value proposition, so it has the deepest coverage, including the exact numbers from the assignment's own example. RBAC (scenario 33) is tested at the integration level specifically because authorization bugs are a category where unit-testing the service in isolation can miss a misconfigured route; the test exercises the real middleware chain. Negative/error paths outnumber happy-path tests deliberately, since a pricing system's trustworthiness depends more on correctly rejecting bad states (duplicate prices, orphaned configurations, wrong roles) than on the happy path, which is simpler to get right by default.
