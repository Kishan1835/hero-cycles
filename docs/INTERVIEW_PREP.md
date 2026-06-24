# Interview Preparation

## Section 20 — Interview Preparation

15 questions a hiring panel would realistically ask about this specific system, with direct answers including honest limitations.

---

**1. Why did you model pricing as an append-only history table instead of just adding an `updatedAt` to a `cost` column?**

Because the core requirement is answering "what did this cost on date X" for any X, not just "what does it cost right now." A mutable column with an `updatedAt` only ever tells you the latest value — the old value is gone the moment you overwrite it, which is exactly the Excel problem restated in SQL. An append-only table where "current price" and "price on date X" are both just "the latest row with effectiveDate less than or equal to X" means both query patterns are the same code path, and nothing is ever destructively lost.

**2. How do you avoid N+1 queries when calculating a configuration's price?**

`priceRepository.getPricesAsOfForParts` takes the full list of part IDs in the configuration and does a single query for all candidate price points up to the target date, then reduces to "latest per part" in application code. That's one round trip regardless of how many components the configuration has, instead of one query per component.

**3. What happens if two pricing managers try to add a price for the same part on the same date at the same time?**

The database enforces a unique constraint on `(partId, effectiveDate)`, so the second write fails with a Prisma P2002 error, which the error handler translates into a 409 Conflict. The first writer wins; the second gets a clear message rather than silently overwriting or corrupting data. This is intentional last-write-rejected behavior, not last-write-wins.

**4. Why can't you hard-delete a part?**

You can, but only if it's not referenced by any configuration. If it is, the system blocks the delete and tells the manager to mark it DISCONTINUED instead. Hard-deleting a part still used in a configuration would mean that configuration's price calculation suddenly can't account for one of its actual components — silently wrong pricing is worse than an explicit block.

**5. Your JWT can't be revoked before it expires. Isn't that a security gap?**

Yes, and it's a real, acknowledged tradeoff rather than an oversight. Stateless JWTs trade instant revocation for not needing a server-side session store, which keeps the API simpler to scale horizontally. The mitigation is a relatively short expiry (8 hours) plus an isActive check at login time — a deactivated account can't get a new token, even though an already-issued token stays valid until it expires. A production hardening step would add a denylist or move to short-lived access tokens with refresh tokens.

**6. How does role-based access control actually work end to end?**

The authenticate middleware verifies the JWT and attaches the user's id, email, and role to the request. An authorize middleware, applied per-route, checks that role against an allowlist and throws a Forbidden error (403) if it doesn't match. Both middlewares run before the controller, so a controller never has to think about authorization — by the time its code runs, the request is already known to be allowed.

**7. Why three roles instead of a more granular permissions system?**

The brief names exactly three stakeholder types with system access (salesperson, pricing manager, admin), and a fine-grained permission-flag system would be solving a problem that doesn't exist yet at this scope. That said, the authorize middleware takes an arbitrary list of allowed roles per route, so it's not hard-coded to exactly three — adding a fourth role or splitting "edit prices" from "edit parts" into separate permissions later wouldn't require restructuring the middleware.

**8. Walk me through what happens when a configuration has a component with no recorded price for the requested date.**

The batched price lookup simply won't have an entry for that part ID in its result map. The service treats that as an unpriced line for that component, sets a hasUnpricedComponents flag on the whole response, and excludes that line from the total. The frontend visually flags it ("No price on this date") rather than hiding the gap. The alternative — failing the entire calculation — would mean one missing price point blocks pricing the whole bicycle, which is worse for the salesperson.

**9. How would this scale if Hero Cycles had 50,000 parts and 10,000 configurations?**

The list endpoints are already paginated. The price-lookup index on partId and effectiveDate keeps "latest price as of X" fast regardless of how many historical price points accumulate per part. The configuration price calculation is proportional to the number of distinct parts in that one configuration, not the total parts in the system, so it doesn't degrade as the catalog grows — only as an individual configuration's component count grows, which is naturally bounded (a bicycle has a finite number of parts).

**10. What's the weakest part of this design, in your own assessment?**

The "popular configurations" dashboard metric is currently a placeholder, ranked by component count, because there's no order or quote tracking yet to measure real popularity. I flagged this explicitly in the code comment and in the assumptions doc rather than letting it look like a finished feature. It's the clearest example of "shipped a reasonable v1, documented the gap" rather than over-claiming completeness.

**11. Why Prisma over a raw SQL query builder or a different ORM?**

Type safety generated directly from the schema means a typo in a field name is a compile error, not a runtime surprise — valuable in a domain (pricing) where a silent wrong-field bug has real financial consequences. The schema file also doubles as readable documentation, which matters for a take-home someone else has to review quickly.

**12. How is the audit log designed, and what would you change for a stricter compliance requirement?**

Each entry captures actor, action, entity type/ID, a JSON metadata blob, and a timestamp — enough to answer "who changed what, when." It does not do field-by-field diffing (storing old value versus new value per field), which a stricter compliance regime might require. That's a deliberate scope cut for this version, not a technical limitation of the approach — the metadata JSON column could carry a full diff without a schema change.

**13. Why does the frontend use React Query instead of just useEffect plus fetch?**

The app's state is almost entirely server state (parts, prices, configurations) — React Query gives caching, deduplication of in-flight requests, and automatic refetch-on-invalidation after mutations, all of which would otherwise be hand-rolled and easy to get subtly wrong (e.g. stale data after a price update). It also keeps loading and error states consistent across every page without repeating boilerplate.

**14. How did you verify the pricing calculation is actually correct, given the testing constraints you mentioned?**

The exact numeric example from the assignment brief itself (a tyre at ₹200 in January, ₹230 in December) is asserted directly in the unit tests, so the test suite isn't just generic CRUD coverage — it specifically proves the system reproduces the brief's own worked example. Separately, I extracted the calculation algorithm into a standalone script with no framework dependencies and ran it directly to confirm the line-total and total-cost math, independent of whether the full Jest suite could execute in the development sandbox.

**15. If you had one more week, what would you build next?**

Real usage tracking (quotes or orders) so "popular configurations" reflects actual sales rather than component count, a CSV bulk-import flow so Hero Cycles can migrate their existing Excel sheet directly instead of re-entering everything by hand, and a refresh-token flow so JWT revocation doesn't require waiting out the full token expiry.
