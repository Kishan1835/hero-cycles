# UI/UX Design

## Section 13 — UI/UX Design

The implemented UI (`frontend/src/pages/`) follows the wireframes below closely. Visual language: deep steel-blue sidebar (industrial, matches a manufacturing brand), a single forge-red accent reserved for primary actions/alerts so it stays meaningful, IBM Plex Sans/Mono for a technical-but-readable feel, generous whitespace so dense pricing tables stay scannable.

### Desktop: Dashboard

```
┌──────────────┬──────────────────────────────────────────────────────┐
│  HERO CYCLES │  Welcome back, Rahul                                  │
│  Pricing Eng │  Here's what's happening with pricing today.          │
│              │                                                        │
│ ▣ Dashboard  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│ ◻ Parts      │  │ 15       │ │ 2        │ │ 3        │ │ 6        │  │
│ ◻ Configs    │  │ Active   │ │ Active   │ │ Active   │ │ Price    │  │
│ ◻ Calculator │  │ parts    │ │ configs  │ │ users    │ │ changes  │  │
│ ◻ Admin      │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│              │                                                        │
│              │  ┌─ Top configurations ──┐ ┌─ Recent activity ──────┐ │
│              │  │ Sprint Sport 27.5     │ │ Priya added a price    │ │
│              │  │ HC-SPORT-275 ₹6,585   │ │ Rahul created a config │ │
│              │  │ Ranger Classic 26     │ │ Anil updated a user    │ │
│              │  │ HC-CLASSIC-26 ₹2,260  │ │                        │ │
│              │  └────────────────────────┘ └─────────────────────────┘│
│ Rahul Verma  │                                                        │
│ SALESPERSON  │                                                        │
│ [Log out]    │                                                        │
└──────────────┴──────────────────────────────────────────────────────┘
```

### Desktop: Price Calculator (the core feature)

```
┌──────────────┬──────────────────────────────────────────────────────┐
│  HERO CYCLES │  Price calculator                                     │
│              │  Pick a configuration and a date to instantly see...  │
│ ▣ Calculator │                                                        │
│              │  ┌────────────────────────────┐  ┌──────────────────┐│
│              │  │ Bicycle configuration       │  │ 📅 As of date    ││
│              │  │ [Hero Ranger Classic 26 ▾]  │  │ [2025-12-15]     ││
│              │  └────────────────────────────┘  └──────────────────┘│
│              │                                                        │
│              │  ┌────────────────────────────────────────────────┐  │
│              │  │ Hero Ranger Classic 26 · HC-CLASSIC-26          │  │
│              │  │ Priced as of December 15, 2025      ₹2,260      │  │
│              │  ├────────────────────────────────────────────────┤  │
│              │  │ Component        Cat.   Qty  Unit    Line      │  │
│              │  │ Steel Frame 26"  FRAME   1   ₹1,800   ₹1,800   │  │
│              │  │ MRF Tyre 26"     TYRE    2   ₹230     ₹460     │  │
│              │  │ ...                                             │  │
│              │  └────────────────────────────────────────────────┘  │
└──────────────┴──────────────────────────────────────────────────────┘
```

### Mobile: Price Calculator (responsive collapse)

```
┌─────────────────────────┐
│ ☰  Hero Cycles           │
├─────────────────────────┤
│ Price calculator         │
│                           │
│ Configuration             │
│ [Ranger Classic 26    ▾] │
│                           │
│ 📅 As of                 │
│ [2025-12-15]             │
│                           │
│ ┌───────────────────────┐│
│ │ Ranger Classic 26      ││
│ │ ₹2,260                ││
│ ├───────────────────────┤│
│ │ Steel Frame 26"        ││
│ │ Qty 1 · ₹1,800         ││
│ │ ───────────────────── ││
│ │ MRF Tyre 26"           ││
│ │ Qty 2 · ₹460           ││
│ └───────────────────────┘│
└─────────────────────────┘
```

### UX decisions and rationale

- **Sidebar nav over top nav.** Five sections, used repeatedly within a session — a persistent sidebar means zero navigation re-orientation cost, important for a tool used mid-customer-conversation.
- **Date picker defaults to today everywhere.** The common case (current price) requires zero extra clicks; historical lookups are an explicit, deliberate change to one field.
- **Role-aware controls, not role-aware pages.** Rather than separate UIs per role, the same pages render with edit controls present/absent based on `user.role` — keeps the mental model ("this is the Parts page") consistent while respecting permissions, and avoids users discovering a feature exists only to be told they can't use it.
- **Unpriced components are visually flagged inline, not hidden.** A salesperson should see "this part has no price for this date" directly in the breakdown rather than a silent gap in the total — prevents underquoting by surprise.
- **Destructive actions require a native confirm dialog.** Lightweight enough not to add a custom modal component for every delete action, but still requires deliberate confirmation before removing a part, configuration, or component.
- **Price history opens in a side drawer, not a new page.** Checking a part's price trend is a quick lookup that shouldn't lose the user's place in the parts table.
- **Self-protection in the Admin page.** A user's own row has its role-select and deactivate button disabled, so an admin can't accidentally lock themselves out — enforced both in the UI (immediate, friendly feedback) and the API (authoritative).

### How user efficiency was optimized
- React Query caching means navigating back to a previously-visited page (e.g. Parts → Configurations → Parts) doesn't show a loading spinner for data that hasn't gone stale.
- The configuration builder lets a salesperson add a part, set its quantity, and immediately move to the next part without leaving the modal — no per-component save round trip.
- Search and category filters on the Parts page use controlled inputs wired directly into the query key, so filtering is immediate without a separate "Apply filters" button.
