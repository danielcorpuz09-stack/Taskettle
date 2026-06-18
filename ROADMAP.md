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

## Phase 2: Next features (designed for, not yet built)
**Collaboration & visibility:** task comments · activity feed · real-time board sync
**Health & tracking:** medicine reminders · health tracking · meal planning
**Future domains:** family calendar · shared notes · goal tracking · vehicle maintenance
**Infrastructure:** email/SMS notifications · app push delivery · data export · activity analytics

> **Decision rule:** all new features must help families coordinate tasks or household
> operations. Single-user or non-household features are deprioritized.
