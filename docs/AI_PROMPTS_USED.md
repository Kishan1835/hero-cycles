# AI Prompts Used During Development

## Section 19 — AI Prompts Used During Development

This documents the kinds of prompts used while building this submission with Claude, in roughly the order they would naturally occur in a real build, for transparency about how AI was used as a development tool.

### Brainstorming prompt
"Hero Cycles prices bicycles from component costs that change over time, currently tracked in Excel. Before writing any code, help me think through who uses a system like this, what breaks today, and what a v1 scope should and should not include."

Used to drive the stakeholder analysis and the assumptions list, particularly useful for surfacing scope-cut decisions (taxes, multi-currency, approval workflows) explicitly rather than silently.

### Architecture prompt
"Given a pricing system where prices change over time and need historical lookup, what's the right way to model that in a relational schema: overwrite-in-place with a separate audit log, or an append-only price history table? Walk through the tradeoffs."

This led directly to the core design decision: `PartPriceHistory` as an append-only ledger rather than a mutable `cost` column on `Part`, with "current price" and "historical price" both resolving through the same query shape (latest entry with `effectiveDate` less than or equal to the target date).

### Backend prompt
"Build the pricing calculation service: given a bicycle configuration's components and quantities, and a target date, return total cost and a per-line breakdown. It needs to avoid N+1 queries when a configuration has many components, and it should degrade gracefully, not fail the whole calculation, if one component has no price on that date."

Resulted in `pricing.service.ts`'s `calculateConfigurationPrice`, including the batched `getPricesAsOfForParts` repository method and the unpriced-component handling that excludes those lines from the total instead of throwing.

### Frontend prompt
"Design a price calculator page where a salesperson picks a configuration and a date and instantly sees the total and breakdown, using React Query for the data fetching and Tailwind for styling consistent with an industrial and manufacturing brand rather than a generic SaaS look."

Shaped `PriceCalculatorPage.tsx` and the steel and forge-red Tailwind color tokens in `tailwind.config.js`.

### Testing prompt
"Write unit tests for the pricing service that specifically verify the assignment's own worked example, a tyre priced at ₹200 in January and ₹230 in December, so the test suite proves the historical pricing logic actually does what the brief describes, not just generic CRUD correctness."

Resulted in the explicit January/December price assertions in `pricing.service.test.ts`, tying the test suite back to the original problem statement.

### Documentation prompt
"Generate the supporting docs (system design, API spec, ERD) so they read as design rationale, not just restated code; explain why each schema and architecture choice was made, not just what it is."

Used for `docs/SYSTEM_DESIGN.md` and `docs/DATABASE_DESIGN.md`, where each table and tech choice is paired with a one-line justification rather than left to speak for itself.

### Interview preparation prompt
"Given this codebase, what are the questions a hiring panel would actually ask about the pricing engine's design, not generic interview questions, but ones specific to the tradeoffs made here, and what's a strong, honest answer to each, including where the design has real limitations?"

Used to generate `docs/INTERVIEW_PREP.md`, with an explicit goal of including the system's actual limitations (no token revocation yet, no order or sales tracking yet) rather than only flattering Q&A.
