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

## Milestone 4 — Tasks & board (core value)
- `Task` model (status, assignee, dueDate, position).
- CRUD + `PATCH` for move/assign/complete.
- Frontend: kanban Board (Todo/Doing/Done) with drag-and-drop,
  Create Task modal, Task detail, assignment, due date.

## Milestone 5 — Reminders
- `Notification` model.
- `node-cron` scanner (due-soon / overdue, deduped).
- `GET /notifications`, mark read.
- Frontend: notification bell + badge, polling.

## Milestone 6 — Polish & hardening
- Mobile board (horizontal scroll / stacked columns), bottom Fast-Add.
- Rate limiting, helmet, input limits, 404/empty/loading states.
- Seed script + minimal tests for services & guards.

## Post-MVP (designed for, not built)
Household inventory · Medicine tracking · Family calendar · Shared notes ·
Goal tracking · real-time sync · email/push delivery.

> Guardrail: if a proposed feature does not help validate "will groups
> coordinate tasks here?", it is postponed. Add it to Post-MVP, not the MVP.
