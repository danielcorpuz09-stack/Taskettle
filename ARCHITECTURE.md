# Taskettle — Architecture

## 1. Goals & non-goals

**Goals (MVP):** validate that small groups will coordinate tasks in a warm,
non-corporate tool. Ship a production-ready, maintainable, mobile-responsive
first version.

**Non-goals (MVP):** real-time collaboration, push/email/SMS delivery, OAuth,
billing. Deferred domains: pet management, family calendar, shared notes, and
goal tracking (see [ROADMAP.md](ROADMAP.md)).

## 2. High-level shape

```
┌─────────────┐     HTTPS / JSON      ┌──────────────────────┐     ┌──────────┐
│  Vue 3 SPA  │  ───────────────────▶ │  Express API (TS)    │ ──▶ │ Prisma   │
│  (Pinia)    │  ◀─────────────────── │  layered modules     │     │ SQLite/PG │
└─────────────┘    Bearer JWT          └──────────────────────┘     └──────────┘
                                              │  node-cron
                                              ▼
                                       reminder scanner → notifications
```

- **Stateless API.** Auth via short-lived JWT access tokens (Bearer header).
- **Layered backend.** `route → controller → service → prisma`. Controllers do
  HTTP; services hold business rules; Prisma is the only data gateway.
- **Feature modules.** Each domain lives in `src/modules/<name>/` with its own
  routes/controller/service/schema. Future modules (inventory, calendar…) are
  added as new folders without touching existing ones.
- **Shared validation.** Zod schemas validate every request body/params.

## 3. Authorization model

The core security rule: **every resource action is scoped to a Circle the user
belongs to.** Membership is enforced two ways: circle-scoped routers
(`/circles/:circleId/...`) use a `requireMembership` guard that loads the
caller's membership and rejects non-members; top-level resource routers
(`/api/assets`, `/api/vehicles`, `/api/maintenance`, `/api/recurring-expenses`)
use `requireAuth` and re-check membership inside the service from the resource's
`circleId` (OWASP A01 – broken access control).

| Role | Can |
|------|-----|
| `OWNER` | everything in the circle + invite + remove members + delete circle |
| `MEMBER` | create/assign/move/complete tasks, invite members |

(Granular role escalation is intentionally deferred; two roles cover the MVP.)

## 4. Data flow: moving a task

1. User drags a card → store optimistically updates `status` + `position`.
2. `PATCH /tasks/:id` with `{ status, position }`.
3. Service verifies membership, updates row, returns canonical task.
4. Store reconciles with server response (rolls back on error).

## 5. Reminders

A `node-cron` job runs every N minutes:

- **Due soon:** `dueDate` within the next 24h and not `DONE` → create a
  `DUE_SOON` notification (once per task, deduped).
- **Overdue:** `dueDate < now` and not `DONE` → `OVERDUE` notification.

The frontend polls `GET /notifications` (every 60s) and shows a bell badge.
This avoids websocket/push infra while still feeling live. Email/push is a
post-MVP swap behind the same notification table.

## 6. Frontend architecture

- **Views** = routed pages: `SignIn`, `Register`, `AcceptInvite`, `Board`,
  `Profile`, plus a page per module (`Inventory`, `Wallet`, `Assets`,
  `RecurringExpenses`, `Vehicles`, `Maintenance`, `Business`/`BusinessDetail`).
- **Stores** (Pinia): `auth`, `board`, `notifications`, `inventory` (incl.
  shopping list), `wallet`, `assets`, `recurring-expenses`, `vehicles`,
  `maintenance`, `business`. Stores own all API calls; components stay
  presentational and do optimistic updates that roll back on error.
- **`lib/api.ts`** = single Axios instance; injects JWT, handles 401 → logout.
- **Design tokens** live in `tailwind.config.js`, mirroring the Stitch
  "Cozy Family Hearth" system (sage / dusty-rose / cream).

## 7. Why these choices (and what we said no to)

| Considered | Decision |
|-----------|----------|
| Postgres from day 1 | SQLite for dev; Prisma makes the prod swap one line. |
| WebSockets for live board | Polling. Cheaper, simpler, enough for families. |
| Redis-backed queue for reminders | In-process `node-cron`. No infra to run MVP. |
| Nuxt / SSR | Plain Vite SPA. SEO irrelevant for a private app. |
| Microservices | Single modular monolith. Split later only if needed. |

## 8. Household & vertical modules

Several production-ready modules extend the core task board. All follow the
same `route → controller → service → prisma` layering, scope every query by
`circleId`, and ship with a backend module + Pinia store + Vue components.

### Phase 1 — household basics (circle-scoped routers)

**Inventory (`src/modules/inventory`)** — tracks household items with stock
levels and categories. `status` is auto-derived from quantity vs. threshold
(In Stock / Low Stock / Out of Stock); includes a dashboard and an
"add to shopping list" bridge.

**Shopping List (`src/modules/shopping-list`)** — collaborative grocery/supply
list with `PENDING → PURCHASED` tracking. Items can optionally link to an
`InventoryItem`.

**Wallet (`src/modules/wallet`)** — household money: `WalletAccount`,
`WalletCategory`, `WalletTransaction`, `Budget`, and `Debt` with `DebtPayment`.
Account balances are **computed server-side** from transactions (never stored or
trusted from the client); all amounts are integer minor units plus an ISO
currency code. Includes a dashboard plus an analytics endpoint feeding insight
charts.

### Phase 2 — home management (top-level resource routers)

These use `requireAuth` + in-service membership checks and expose
`POST /list` (with `circleId` in the body) instead of `GET`.

**Home Assets (`src/modules/assets`)** — appliances, electronics, furniture and
power tools with purchase date, warranty expiration, serial number, receipt
photo URLs and optional current value.

**Recurring Expenses (`src/modules/recurring-expenses`)** — utility bills and
subscriptions with amount, frequency (monthly/quarterly/annual), due day and an
auto-pay flag for monthly spending summaries.

**Vehicles (`src/modules/vehicles`)** — per-vehicle registration and insurance
expiry tracking; supports multiple vehicles per circle.

**Maintenance (`src/modules/maintenance`)** — recurring household upkeep
schedules that **auto-create board tasks** when due, bridging upkeep with the
kanban board (deduped via `lastTaskId`).

### Phase 3 — vertical (`src/modules/business`)

**Business** — a flexible records system for small operations (print shop,
rental, café, etc.). Each `Business` defines its own `BusinessFieldDef`s
(typed custom fields) and stores `BusinessRecord`s with `BusinessFieldValue`s.
Records can optionally link to a `WalletTransaction` and/or a board `Task`.
Uses **both** routing patterns: circle-scoped reads/creates under
`/circles/:circleId/businesses`, and resource-scoped mutations under
`/businesses`.

Each module is independently deployable and can be archived/disabled without
touching the task board.

## 9. How to add a Post-MVP module

Pattern (see inventory/wallet/shopping-list as templates):

1. **Prisma model** in `schema.prisma` with `circleId` relation
2. **Backend module:** create `apps/server/src/modules/<name>/` with:
   - `*.schema.ts` (Zod validation)
   - `*.service.ts` (business logic)
   - `*.controller.ts` (HTTP + status codes)
   - `*.routes.ts` (route definitions)
3. **Frontend store** in `apps/web/src/stores/<name>.ts` with API calls
4. **Vue components** in `apps/web/src/components/` and views as needed
5. **Documentation:** update `docs/API.md` (endpoint contract) and `SCHEMA.md` (models)
