# Hero Cycles — Pricing Engine

A full-stack internal tool that replaces Hero Cycles' Excel-based component pricing with a real pricing engine: manage parts, track time-based price changes, build bicycle configurations from those parts, and instantly calculate current or historical pricing with a full component breakdown.

Built as an internship take-home assignment. This README is the entry point — see `docs/` for the deeper design, API, and interview-prep material.

---

## What this solves

Hero Cycles currently prices bicycles using Excel. Component costs (tyres, frames, gears, brakes…) change over time, and pricing a configuration means manually looking up the latest cost of every part and adding it up by hand. That's slow, error-prone, has no history, and can't tell you "what would this configuration have cost in January?"

This app gives salespeople and pricing managers:
- A **parts catalog** with category, status, and SKU
- A **price history ledger** per part — every price change is recorded with an effective date, not overwritten
- A **configuration builder** — assemble a bicycle model from parts with quantities (e.g. 2 tyres, 1 frame)
- An **instant price calculator** — total cost + full component breakdown, for *any* date, past or present
- A **dashboard** with KPIs, top configurations, and recent activity
- **Role-based access** (Salesperson / Pricing Manager / Admin) and a full audit log

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + TypeScript, Vite, TailwindCSS, React Query, React Hook Form, Zod, Lucide icons |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL via Prisma ORM |
| Auth | JWT (stateless), bcrypt password hashing, role-based middleware |
| Testing | Jest + ts-jest + Supertest |
| Docs | Swagger/OpenAPI (auto-served at `/api/docs`) |

See `docs/SYSTEM_DESIGN.md` for the reasoning behind each choice.

---

## Project structure

```
hero-cycles-pricing-engine/
├── backend/                 # Express + Prisma API
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── seed.ts          # Demo data (matches the Jan ₹200 → Dec ₹230 example)
│   ├── src/
│   │   ├── config/          # env, prisma client, swagger
│   │   ├── controllers/     # HTTP request/response handling
│   │   ├── services/        # business logic (pricing engine lives here)
│   │   ├── repositories/    # Prisma data access
│   │   ├── routes/          # Express route definitions + RBAC wiring
│   │   ├── middleware/      # auth, RBAC, validation, error handling
│   │   ├── validators/      # Zod schemas
│   │   ├── utils/           # errors, jwt, password, logger
│   │   └── app.ts / server.ts
│   └── tests/
│       ├── unit/            # service-layer tests (mocked repositories)
│       └── integration/     # route-level tests (Supertest)
├── frontend/                # React + Vite SPA
│   └── src/
│       ├── api/             # typed API client functions
│       ├── components/      # reusable UI, forms, layout
│       ├── context/         # auth context
│       ├── hooks/           # React Query hooks
│       ├── pages/           # route-level pages
│       └── types/           # shared domain types
└── docs/                    # design docs, ERD, API spec, interview prep
```

---

## Quick start

### Prerequisites
- Node.js 20+
- A PostgreSQL 14+ database (local install, Docker, or a hosted instance like Supabase/Neon/Railway)

### 1. Database

```bash
# Easiest: spin up Postgres in Docker
docker run --name hero-cycles-db -e POSTGRES_USER=hero_user -e POSTGRES_PASSWORD=hero_pass \
  -e POSTGRES_DB=hero_cycles_pricing -p 5432:5432 -d postgres:16
```

### 2. Backend

```bash
cd backend
cp .env.example .env          # adjust DATABASE_URL / JWT_SECRET if needed
npm install
npx prisma migrate dev --name init     # creates tables
npm run prisma:seed                    # loads demo parts, configs, users
npm run dev                            # starts API on http://localhost:4000
```

API docs: **http://localhost:4000/api/docs**
Health check: **http://localhost:4000/health**

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                            # starts UI on http://localhost:5173
```

### 4. Log in

Seeded demo accounts (password for all: `Password123!`):

| Role | Email |
|---|---|
| Admin | `admin@herocycles.com` |
| Pricing Manager | `manager@herocycles.com` |
| Salesperson | `sales@herocycles.com` |

The login screen has one-click buttons to fill these in.

---

## Running tests

```bash
cd backend
npm test                 # all tests
npm run test:coverage    # with coverage report
```

See `docs/TESTING.md` for the full test strategy and scenario list.

> **Note on this submission's build environment:** This code was written and reviewed in a sandboxed environment with no network access to `binaries.prisma.sh`, so `prisma generate` could not download its query-engine binary here, and the test suite could not be executed end-to-end in that sandbox. The pricing algorithm itself was independently verified with a standalone (non-Prisma) script — see `docs/TESTING.md` for what was and wasn't verifiable in this environment, and what to expect the first time you run `npm install && npx prisma generate` on a machine with normal internet access (it will just work). The **frontend** had no such restriction and was fully type-checked and production-built successfully.

---

## Key design decision: how pricing actually works

Prices are never overwritten. `PartPriceHistory` is an append-only ledger: each row has a `cost` and an `effectiveDate`. The "current price" of a part is just the most recent row with `effectiveDate <= now`. The "price on March 15th" is the most recent row with `effectiveDate <= March 15th`. This is what makes historical pricing queries ("what did this bicycle cost last quarter?") possible without any extra bookkeeping — see `docs/PSEUDOCODE.md` for the exact algorithm.

---

## Documentation index

- `docs/PRODUCT_THINKING.md` — problem understanding, stakeholders, requirements
- `docs/QUESTIONS_AND_ASSUMPTIONS.md` — 25+ clarifying questions and 20+ documented assumptions
- `docs/USE_CASES_AND_STORIES.md` — use cases and Agile user stories
- `docs/SYSTEM_DESIGN.md` — architecture, stack rationale, Mermaid diagrams, ERD
- `docs/API_SPEC.md` — full REST API reference with examples
- `docs/PSEUDOCODE.md` — core algorithms in pseudocode
- `docs/UI_UX.md` — wireframes and UX rationale
- `docs/TESTING.md` — test strategy and scenarios
- `docs/SECURITY_AND_PERFORMANCE.md` — security and performance notes
- `docs/DEPLOYMENT.md` — deploy to Neon + Render + Vercel
- `docs/AI_PROMPTS_USED.md` — prompts used during development
- `docs/INTERVIEW_PREP.md` — likely interview questions with answers

---

## Future enhancements

- Multi-currency / multi-region pricing (architecture already supports adding a `region` dimension to `PartPriceHistory`)
- Bulk CSV import for migrating the existing Excel sheet
- Quote/order tracking so "popular configurations" reflects real sales, not just part count
- Soft-delete + restore for parts and configurations
- WebSocket-based live price updates on the calculator screen
