# Use Cases & User Stories

## Section 4 — Use Cases

### Use Case 1: Salesperson creates a bicycle configuration

- **Actor**: Salesperson
- **Precondition**: User is authenticated; at least one Active part exists in the catalog.
- **Main Flow**:
  1. Salesperson navigates to Configurations → New Configuration.
  2. Enters name, model code, optional description.
  3. Adds one or more parts with quantities from the active parts catalog.
  4. Submits the form.
  5. System validates all part IDs exist, model code is unique, and at least one part is included.
  6. Configuration is created and the salesperson is shown the new configuration with its live price.
- **Postcondition**: A new `BicycleConfiguration` row exists, linked to its `ConfigurationPart` rows; an audit log entry is recorded.
- **Alternative Flow**: If the model code is already taken, the system returns a 409 Conflict and the form shows the error without losing entered data.

### Use Case 2: Salesperson checks current price

- **Actor**: Salesperson
- **Precondition**: At least one configuration exists.
- **Main Flow**:
  1. Salesperson opens the Price Calculator page.
  2. Selects a configuration from the dropdown.
  3. Leaves the date as today (default).
  4. System instantly displays total cost and a line-by-line component breakdown.
- **Postcondition**: No data is changed — this is a read-only calculation.
- **Alternative Flow**: If a component has no recorded price as of today (shouldn't normally happen, but possible for a brand-new part with a future effective date), that line is flagged "No price on this date" and excluded from the total, with the rest of the calculation still shown.

### Use Case 3: Manager updates tyre cost

- **Actor**: Pricing Manager
- **Precondition**: The tyre part already exists in the catalog.
- **Main Flow**:
  1. Manager opens Parts, finds the tyre, opens its price history drawer.
  2. Enters a new cost (e.g. ₹230) and effective date (e.g. December 1).
  3. Submits.
  4. System checks no existing price point shares that exact effective date.
  5. New price point is added to the ledger; it does not overwrite the January ₹200 entry.
- **Postcondition**: Any configuration including this tyre now calculates a higher total when priced on/after December 1, while still correctly returning ₹200 for dates before that.
- **Alternative Flow**: If a price point already exists for that exact date, the system returns a 409 Conflict asking the manager to pick a different date or treat it as a correction.

### Use Case 4: Manager views pricing history

- **Actor**: Pricing Manager (or any authenticated user — history is read-only-visible to all roles)
- **Precondition**: The part has at least one price point.
- **Main Flow**:
  1. User opens the part's price history drawer.
  2. System lists all price points, newest first, each with cost, effective date, and who recorded it.
  3. The most recent entry is visually marked "Current."
- **Postcondition**: No data changes.
- **Alternative Flow**: None — purely a read operation.

### Use Case 5: Admin manages users

- **Actor**: Admin
- **Precondition**: At least one other user account exists.
- **Main Flow**:
  1. Admin opens the Admin page.
  2. Views the full user list with role and active/inactive status.
  3. Changes a user's role via the dropdown, or toggles their active status.
  4. System applies the change immediately and logs it.
- **Postcondition**: The target user's role/status is updated; an audit entry is recorded.
- **Alternative Flow**: Admin cannot deactivate or change the role of their own account (prevents accidental self-lockout) — the controls are disabled for their own row.

---

## Section 5 — User Stories

1. As a **salesperson**, I want to search parts by name or SKU, so that I can quickly find the right component while building a configuration.
2. As a **salesperson**, I want to build a bicycle configuration from existing parts, so that I can quote a new model to a customer.
3. As a **salesperson**, I want to instantly calculate a configuration's total price, so that I don't have to manually add up component costs.
4. As a **salesperson**, I want to see a price breakdown by component, so that I can explain to a customer what makes up the cost.
5. As a **salesperson**, I want to calculate a configuration's price as of a past date, so that I can answer "what would this have cost in January."
6. As a **pricing manager**, I want to add a new price point for a part with an effective date, so that future quotes reflect the updated cost without losing the old price.
7. As a **pricing manager**, I want to see the full price history of a part, so that I can track how its cost has trended over time.
8. As a **pricing manager**, I want to be prevented from creating two prices for the same part on the same date, so that the price history stays unambiguous.
9. As a **pricing manager**, I want to create new parts with an initial cost, so that newly sourced components can be priced into configurations.
10. As a **pricing manager**, I want to mark a part as discontinued instead of deleting it, so that historical configurations using it can still be priced correctly.
11. As an **admin**, I want to deactivate a user's account, so that former employees lose access immediately without deleting their historical activity.
12. As an **admin**, I want to change a user's role, so that I can promote a salesperson to pricing manager without recreating their account.
13. As an **admin**, I want to delete a part that's never been used in any configuration, so that I can clean up mistaken catalog entries.
14. As an **admin**, I want every price change and deletion logged with who did it and when, so that I have an audit trail for compliance and dispute resolution.
15. As a **manager (business stakeholder)**, I want a dashboard showing active parts, configurations, and recent price changes, so that I have an at-a-glance view of pricing health.
16. As a **manager**, I want to see which configurations are most complex/popular, so that I understand which models matter most.
17. As **any authenticated user**, I want clear error messages when something goes wrong (e.g. duplicate SKU), so that I know how to fix my input instead of guessing.
18. As a **salesperson**, I want my role to restrict me from editing parts I shouldn't be able to change, so that the catalog stays accurate without needing me to be careful manually.
19. As a **pricing manager**, I want to remove a component from an existing configuration, so that I can correct a configuration that was built with the wrong part — as long as it's not the last remaining component.
20. As a **new user**, I want to log in with a simple email/password form and stay logged in for my shift, so that I'm not constantly re-authenticating while quoting customers.
21. As an **admin**, I want to register new accounts with a specific role, so that I can onboard new hires directly into the right access level.
22. As a **salesperson**, I want to add an additional component to an existing configuration, so that I can adjust a model without rebuilding it from scratch.
