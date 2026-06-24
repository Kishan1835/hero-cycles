# Product Thinking

## 1. Problem Understanding

### Current process
Hero Cycles prices bicycles by maintaining component costs in Excel. A salesperson (or whoever owns the sheet) looks up each part's latest price and manually sums them to quote a configuration. Price changes are entered as edits to existing cells — the old number is gone the moment the new one is typed in.

### Pain points
- **No history.** Once a cell is overwritten, there's no record of what a tyre cost in January vs. December. Margin analysis, audits, and "why did this configuration get cheaper/pricier" questions can't be answered.
- **Manual aggregation.** Every price check means manually finding and summing the right cells. Slow, and a single wrong cell reference produces a wrong quote.
- **No single source of truth.** If the sheet is duplicated, emailed around, or edited offline, different people can be quoting from different versions.
- **No access control.** Anyone with the file can change any price — there's no way to say "salespeople can view but not edit."
- **No audit trail.** No record of who changed a price, when, or why.
- **Doesn't scale.** "Thousands of bicycle configurations" in a spreadsheet becomes unmanageable — slow to navigate, easy to introduce formula errors, hard to onboard new staff onto.

### Business impact
- Quoting delays during sales conversations (a customer waiting while someone tabs through a spreadsheet).
- Pricing errors that either undercut margin or overprice and lose the sale.
- No data to support strategic decisions (e.g. "which configurations got more expensive fastest this year").
- Risk concentration in whoever maintains the sheet — if they're unavailable, pricing work stalls.

### Risks of the Excel approach
- **Data loss**: file corruption, accidental overwrite, no real backup/version history.
- **Concurrency**: two people editing the same sheet creates silent conflicts.
- **No validation**: nothing stops a negative price, a duplicated part, or a typo being typed straight into a customer quote.
- **Security**: spreadsheets are easy to copy and leak; no row-level permissions.

---

## 2. Stakeholders

### Salesperson
- **Goals**: Quote a bicycle configuration accurately and fast, ideally while talking to a customer.
- **Pain points**: Waiting on price lookups; no confidence the number is current; can't easily explain a price breakdown to a customer.
- **System interactions**: Browses parts and configurations (read-only on parts), builds new configurations, runs the price calculator.

### Pricing Manager
- **Goals**: Keep component costs accurate and current; understand how costs are trending.
- **Pain points**: No structured way to log a price change with an effective date; no visibility into which configurations a price change will affect.
- **System interactions**: Creates/edits parts, adds price history entries, views price history and trends.

### Procurement Team
- **Goals**: Feed real supplier cost changes into the pricing system promptly so sales quotes reflect reality.
- **Pain points**: No direct system to record a new supplier price; currently relies on someone else updating the spreadsheet correctly.
- **System interactions**: In this version, procurement data flows in via the Pricing Manager role (a realistic v1 scope cut — see Assumptions). A natural extension is a dedicated procurement role/integration.

### Admin
- **Goals**: Keep the system itself healthy — right people have the right access, data integrity is maintained.
- **Goals**: Onboard/offboard staff, fix data issues, oversee everything pricing managers and salespeople do.
- **Pain points**: No central place to manage who can do what.
- **System interactions**: Full CRUD everywhere, user management, can deactivate accounts and reassign roles, can delete parts/configurations (with safety checks).

### Management
- **Goals**: Visibility into pricing trends, configuration popularity, and overall system health for business decisions.
- **Pain points**: No dashboard or reporting today — insights require manually digging through the spreadsheet.
- **System interactions**: Primarily the dashboard — KPIs, recent activity, top configurations. Read-only in this version.

---

## 3. Functional Requirements

### Parts Management
- Create, read, update, and (conditionally) delete parts.
- Fields: Part ID (UUID), Name, Category (Frame / Gear Set / Tyre / Brake / Seat / Handlebar / Chain / Pedal / Other), SKU, Cost (via price history, see below), Effective Date (per price entry), Status (Active / Discontinued / Draft).
- A part cannot be hard-deleted if it's referenced by any bicycle configuration — it must be discontinued instead, so historical configurations stay priceable. (See Assumptions.)

### Pricing History
- Every price change is a new, immutable entry in an append-only ledger (`PartPriceHistory`), not an overwrite.
- Support date-based pricing: "what was the price of part X on date Y" resolves to the latest entry with `effectiveDate <= Y`.
- Two price entries for the same part can't share the same effective date (prevents ambiguous lookups).

### Bicycle Configuration
- Create a configuration from a name, model code, optional description, and a list of (part, quantity) pairs.
- Add, remove, and edit (change quantity of) components on an existing configuration.
- A configuration must always have at least one component (can't remove the last one).
- Model codes are unique.

### Price Calculation
- Given a configuration and a date (default: today), compute the total cost and a per-component breakdown (unit cost × quantity = line total).
- Support both "current cost" (date = today) and "historical cost" (date = any past date) through the same endpoint.
- If a component has no recorded price as of the requested date, it's flagged in the breakdown rather than silently failing the whole calculation.

### User Management
- Three roles: Admin, Pricing Manager, Salesperson.
- Admin can activate/deactivate accounts and change roles (but not their own role or their own active status, to avoid self-lockout).

### Dashboard
- KPIs: active parts, active configurations, active users, price changes in the last 30 days.
- Recent updates: a feed of the latest audit log entries.
- Popular configurations: surfaced by component count as a v1 proxy (see Assumptions) pending real usage/quote tracking.

---

## 4. Non-Functional Requirements

- **Performance**: Price calculation for a configuration must batch-fetch all component prices in one query (not N+1) so it stays fast even as configurations grow more complex. Target: < 200ms for a typical configuration calculation.
- **Scalability**: Pagination on all list endpoints (parts, configurations) so the system doesn't degrade as the catalog grows into the thousands.
- **Security**: JWT-based auth, bcrypt-hashed passwords, role-based authorization on every mutating endpoint, input validation on every request, rate limiting on auth endpoints.
- **Maintainability**: Layered architecture (controller → service → repository) so business logic, HTTP concerns, and data access don't tangle together; Zod schemas as the single source of truth for input validation.
- **Usability**: Role-appropriate UI (salespeople don't see edit controls they can't use); clear error messages; instant feedback on price calculations.
- **Auditability**: Every create/update/delete/price-change/login is recorded in an audit log with actor, action, entity, and timestamp.
- **Availability**: Stateless API (JWT, no server-side sessions) so it can be horizontally scaled behind a load balancer without sticky sessions.
