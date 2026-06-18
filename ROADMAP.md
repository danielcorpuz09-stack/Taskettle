# Taskettle — Roadmap

Ordered by dependency. Each milestone is independently shippable/testable.

## Milestone 0 — Foundation ✅ (this scaffold)
- Monorepo (npm workspaces), TS configs, lint.
- Backend app shell: Express, error handling, env config, Prisma client.
- Frontend app shell: Vite, Tailwind cozy tokens, router, Axios client.
- Docs: architecture, schema, API, instructions & skills.

## Milestone 1 — Identity
- Prisma `User` model + migration.
- `POST /auth/register`, `POST /auth/login`, `GET /auth/me`.
- bcrypt hashing, JWT issue/verify, `requireAuth` middleware.
- Frontend: Sign In + Register views, `auth` store, route guards.

## Milestone 2 — Circles & membership
- `Circle`, `Membership` models.
- Create / list circles; auto-owner membership on create.
- `requireMembership` guard.
- Frontend: circle picker + empty board.

## Milestone 3 — Invitations
- `Invite` model (token, status, expiry).
- Create invite, accept invite (existing or new user).
- Frontend: Invite Member modal.

## Milestone 4 — Tasks & board (core value) ✅
- `Task` model (status, assignee, dueDate, position, priority, category).
- CRUD + `PATCH` for move/assign/complete.
- Frontend: kanban Board (Todo/Doing/Done) with drag-and-drop,
  Create Task modal, Task detail, priority/category badges.

## Milestone 5 — Reminders ✅
- `Notification` model.
- `node-cron` scanner (due-soon / overdue, deduped).
- `GET /notifications`, mark read.
- Frontend: notification bell + badge, polling.

## Milestone 6 — Household modules ✅
- **Inventory:** items, stock levels, categories, dashboard.
- **Shopping List:** linked to inventory, purchase tracking, status toggling.
- **Wallet:** accounts, categories, transactions, budgets, debts with payments.
- All three include backend + frontend (stores, views, modals).

## Milestone 7 — Polish & hardening (deferred)
- Mobile board (horizontal scroll / stacked columns), bottom Fast-Add.
- Rate limiting, helmet, input limits, 404/empty/loading states.
- Comprehensive test suite.

## Phase 2 — Household Management (designed; core features in progress)

**Navigation:** grouped under "Home" parent. All circle-scoped (shared visibility).

### Home Assets (`src/modules/assets/`)
Track everything valuable in the house: appliances, electronics, furniture, power tools.
- Fields: name, category, purchase date, warranty expiration, serial number, receipt photos, current value.
- Schema: flat list + category tags (simple, Taskettle-aligned).
- Competitors: Sortly, Encircle.

### Recurring Expenses (extend `src/modules/wallet/` or new module)
Consolidates utility bills + subscriptions. Track what comes back every month.
- **Utility Bills:** electricity, water, internet, mobile, gas.
- **Subscriptions:** Netflix, Spotify, ChatGPT, domains, hosting, SaaS.
- Fields: name, category, amount, due date, frequency (monthly/quarterly/annual), auto-pay flag.
- Monthly spending summary (e.g., "Subscriptions ₱4,280/month").
- Reuses wallet transaction logic; adds recurrence scheduling.
- Competitor: Bobby (for subscriptions).

### Home Maintenance (`src/modules/maintenance/`)
Track recurring household maintenance; auto-create tasks on the board.
- Track: aircon cleaning, water tank cleaning, roof inspection, pest control, septic tank service.
- Integration: auto-creates recurring tasks with specified schedule + assignee.
- Bridges Home Assets with task board (e.g., "Aircon filter change" → task every 6 months).

### Vehicle Management (`src/modules/vehicles/`)
Track per vehicle: registration, insurance, fuel expenses, maintenance log, tire/oil changes.
- Support multiple vehicles per circle.
- Circle-scoped; useful for shared household vehicles.
- Fields: model, plate number, insurance expiry, registration expiry, fuel log, maintenance records.

## Phase 2.5 — Pet Management (deferred)
Track: vaccinations, vet visits, food inventory, grooming schedules, expenses.
Lower priority; can follow Phase 2.

## Phase 3 — Vertical Markets (deferred)
**Business Management:** niche expansion toward small landlords / rental properties.
- Track: tenants, rent payments, maintenance requests, utility bills, property inventory.
- Also applicable to other small businesses (3D printing, etc.); design for flexibility.

---

## Previous Phase 2 backlog (now consolidated into Phase 2 household features above)
**Collaboration & visibility:** task comments · activity feed · real-time board sync
**Health & tracking:** medicine reminders · health tracking · meal planning
**Future domains:** family calendar · shared notes · goal tracking
**Infrastructure:** email/SMS notifications · app push delivery · data export · activity analytics

> **Decision rule:** all new features must help families coordinate tasks or household
> operations. Single-user or non-household features are deprioritized.
