# Questions Asked During Solutioning & Assumptions Made

## Section 2 — Questions Asked During Solutioning

These are the questions a careful engineer would raise before building this system. Each is answered by an assumption in Section 3, or by a concrete design decision elsewhere in the docs.

1. Can a bicycle configuration have multiple units of the same part (e.g. 2 tyres)? 
2. Can a bicycle configuration have zero components, even temporarily?
3. Are prices region-specific, or is there one national price list?
4. Can two price entries for the same part share an effective date?
5. Who is allowed to create a new part — sales, pricing managers, or both?
6. Who is allowed to edit an existing price — and should edits be allowed at all, or only new entries?
7. Are taxes (GST) included in part costs, or applied separately at quote time?
8. Should deleting a part be allowed if it's used in an active configuration?
9. What happens to a configuration's price if one of its parts is discontinued?
10. Should there be a "draft" state for parts not yet ready to be priced?
11. Is there a concept of bulk/wholesale discounts on configurations?
12. Should configurations have their own price override, or is price always derived purely from components?
13. How many bicycle configurations and parts should the system be expected to handle at scale?
14. Should salespeople be able to create configurations, or only pricing managers?
15. Is there a need for configuration versioning (e.g. "Sport 27.5 v2")?
16. How should "popular configurations" be measured without an order/sales system yet?
17. Should login sessions expire, and if so, how long should a JWT stay valid?
18. Should there be a password reset flow in this version, or is that out of scope?
19. Is multi-currency support needed, given Hero Cycles likely also exports?
20. Should the system support soft-delete (recoverable) instead of hard-delete?
21. What's the right granularity for roles — is "Pricing Manager" one role, or should "view price" and "edit price" be separable permissions?
22. Should there be an approval workflow for large price changes (e.g. above a threshold)?
23. How should the system behave if a price calculation is requested for a date before any part had a recorded price?
24. Should historical price lookups be exact-date only, or support date ranges (e.g. "average cost over Q1")?
25. Is procurement a separate user role with its own permissions, or does it route through pricing managers?
26. Should there be email notifications when prices change significantly?
27. How is "SKU" uniqueness enforced — globally, or per category?
28. Should configurations support optional/alternate components (e.g. "tyre: choose A or B")?
29. What level of audit detail is required — every field change, or just the high-level action?
30. Should the dashboard be role-specific (different KPIs for sales vs. management)?

---

## Section 3 — Assumptions

Each assumption below is the concrete decision the codebase makes, with justification. Where an assumption is a known scope cut, the "future enhancement" path is noted.

1. **A configuration can include multiple units of the same part** (e.g. 2 tyres). *Justification*: bicycles physically need 2 tyres — the data model (`ConfigurationPart.quantity`) supports this directly, and the pricing engine multiplies unit cost × quantity.

2. **A configuration must always have at least one component.** *Justification*: a configuration with zero parts isn't a priceable bicycle; the API explicitly blocks removing the last remaining part.

3. **Pricing is national, not region-specific, in this version.** *Justification*: the assignment brief describes a single price list (Jan ₹200 → Dec ₹230) with no mention of regional variance. The schema is structured so a `region` column could be added to `PartPriceHistory` later without a redesign.

4. **Two price entries for the same part cannot share an effective date.** *Justification*: this would make "the price on date X" ambiguous. Enforced with a unique constraint on `(partId, effectiveDate)`.

5. **Only Pricing Managers and Admins can create or edit parts; Salespeople have read-only access to the catalog.** *Justification*: matches the stakeholder goals — sales need to see and use parts, not redefine the catalog.

6. **Prices are never edited in place — only new price points are added.** *Justification*: this is the core fix for the "no history" pain point. An apparent "price correction" is modeled as a new entry with today's effective date, preserving the full trail.

7. **GST/taxes are out of scope for this version** — costs in the system are base component costs, and tax would be applied at the quoting/invoicing layer outside this system. *Justification*: the assignment brief's worked example (₹200 → ₹230) doesn't mention tax, and conflating tax logic into component pricing would blur the core requirement. Documented here as an explicit scope cut, not an oversight.

8. **A part cannot be hard-deleted if it's used in any configuration; it must be set to `DISCONTINUED` instead.** *Justification*: hard-deleting would silently break historical pricing for any configuration that used it. Discontinuing preserves history while signaling the part is no longer sold.

9. **A discontinued part keeps its full price history and can still be priced for past dates**, but new configurations should generally avoid using it (UI surfaces status; this isn't hard-blocked at the API level, by design — a pricing manager may have a legitimate reason to keep using a "discontinued-but-still-in-stock" part). *Justification*: keeps the system flexible rather than overly prescriptive.

10. **Parts support a `DRAFT` status** for parts being set up but not yet ready to price/sell. *Justification*: realistic workflow — a new part may be entered before its first official price is finalized. (Note: the current API still requires an `initialCost` at creation time, since a part with literally no price can't be priced into anything — `DRAFT` signals "not yet for sale," not "unpriced.")

11. **Bulk/wholesale discounts are out of scope.** *Justification*: not mentioned in the brief; pricing is per-component summation only. Flagged as a future enhancement.

12. **A configuration's price is always derived purely from its components — there is no manual override field.** *Justification*: this is the heart of "instantly calculate bicycle pricing" — if configurations could have an arbitrary override price, the system would silently drift from the component-based source of truth the assignment is asking for.

13. **The system should comfortably handle low thousands of parts and configurations** without architectural changes (pagination, indexed lookups, batched price queries). *Justification*: "thousands of bicycle configurations" is stated directly in the brief.

14. **Salespeople can create configurations** (not just view them), since configuration-building is core to their daily workflow (assembling a quote). Editing/deleting existing configurations is restricted to Pricing Managers/Admins. *Justification*: balances sales autonomy with pricing governance.

15. **Configuration versioning (e.g. "v2") is out of scope.** A configuration's component list can be edited directly; if true point-in-time versioning of configurations themselves (not just prices) is needed later, model codes could be suffixed (`HC-SPORT-275-V2`). *Justification*: the brief's worked example is about component price history, not configuration history.

16. **"Popular configurations" on the dashboard is approximated by component count**, with a clear code comment and doc note marking this as a placeholder. *Justification*: there's no order/quote/sales-event tracking in this version's scope, so true popularity can't be measured yet — documented as a known limitation and future enhancement rather than silently faked.

17. **JWTs expire after 8 hours** (configurable via `JWT_EXPIRES_IN`). *Justification*: balances not forcing re-login mid-shift against limiting the blast radius of a leaked token. No refresh-token flow in this version — re-login after expiry.

18. **Password reset / forgot-password flow is out of scope** for this version; Admins can deactivate/reactivate accounts as the interim mechanism for access issues. *Justification*: scope control — this is a take-home assignment, not a production launch; flagged as a future enhancement.

19. **Multi-currency is out of scope; all costs are in INR (₹).** *Justification*: the brief is explicitly INR-denominated. The `Decimal(10,2)` column type and isolated pricing service make adding a currency field a contained future change.

20. **Hard deletes are used for parts/configurations (when allowed) rather than soft-delete,** but every destructive action is captured in the audit log, and parts in use can't be hard-deleted at all (see #8). *Justification*: keeps the schema simpler for this scope while still preserving a recoverable trail through the audit log; true soft-delete (with restore) is flagged as a future enhancement.

21. **Roles are coarse-grained** (Admin / Pricing Manager / Salesperson) rather than fine-grained permission flags. *Justification*: matches the stakeholders named in the brief exactly; a permissions-matrix system would be over-engineering for three clearly-scoped roles, though the `authorize()` middleware is written generically enough to extend later.

22. **No approval workflow for price changes** — any Pricing Manager or Admin can add a price point unilaterally, recorded in the audit log. *Justification*: not requested in the brief; flagged as a natural future enhancement for high-value changes.

23. **A price calculation for a date before a part's first recorded price treats that component as unpriced** (excluded from the total, flagged in the breakdown) rather than throwing an error for the whole configuration. *Justification*: a salesperson should still see what *can* be priced rather than getting a hard failure.

24. **Historical lookups are exact-date only** (price as of a specific day), not date-range aggregates like "average cost over Q1." *Justification*: matches the brief's worked example exactly (Jan vs. December price); range aggregation is a natural future enhancement.

25. **Procurement does not have a separate system role in this version** — their cost updates are assumed to reach the Pricing Manager, who enters them. *Justification*: the brief lists Procurement as a stakeholder/influence but doesn't describe a distinct procurement workflow; modeled as informing the Pricing Manager rather than inventing an unscoped role.

26. **No email/notification system in this version.** *Justification*: not requested; the audit log and dashboard "recent activity" feed serve as the in-app visibility mechanism instead.

27. **SKU is globally unique across all parts**, not scoped per category. *Justification*: SKUs are manufacturing identifiers in real inventory systems and are expected to be globally unique by convention.

28. **Optional/alternate components within a configuration (e.g. "tyre: choose A or B") are out of scope.** A configuration has one fixed list of components. *Justification*: not described in the brief; this would meaningfully complicate the pricing model (pricing a "configuration" would become pricing a *family* of configurations) and is flagged as a future enhancement rather than silently simplified away.

29. **Audit logging captures the action, entity, actor, and relevant metadata (e.g. new price, changed fields) at a summary level**, not a full field-by-field diff. *Justification*: sufficient for traceability and accountability without the complexity of a generic diffing system.

30. **The dashboard is not role-specific in this version** — all authenticated users see the same KPIs (read-only). *Justification*: keeps v1 simple; role-tailored dashboards are a reasonable future enhancement once usage patterns are clearer.
