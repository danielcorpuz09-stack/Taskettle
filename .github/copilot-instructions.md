# Taskettle — Copilot Instructions

Taskettle is a **cozy, family-friendly task board** (Trello's calm cousin) for
families, roommates and small groups. Keep everything warm, simple, and
non-corporate. Read [ARCHITECTURE.md](../ARCHITECTURE.md), [ROADMAP.md](../ROADMAP.md)
and [docs/API.md](../docs/API.md) before non-trivial changes.

## Product principles
- Priorities in order: **simplicity → maintainability → mobile responsiveness
  → developer experience → future extensibility**.
- Challenge scope creep. If a feature does not help validate the MVP
  ("will groups coordinate tasks here?"), propose postponing it to Post-MVP.
- Tone of UI copy: warm, plain language. Avoid enterprise jargon
  ("sprint", "backlog", "stakeholder"). Use "Circle", "task", "due".

## Monorepo
- npm workspaces: `apps/server` (`@taskettle/server`), `apps/web` (`@taskettle/web`).
- Run both: `npm run dev` from root. Migrate: `npm run db:migrate`.

## Backend (apps/server)
- Express + TypeScript + Prisma (SQLite dev / Postgres prod).
- Layering is mandatory: **route → controller → service → prisma**.
  Controllers only do HTTP (parse/validate/respond). Business rules live in
  services. Prisma is accessed ONLY from services.
- One feature per `src/modules/<name>/` folder
  (`*.routes.ts`, `*.controller.ts`, `*.service.ts`, `*.schema.ts`).
- Validate every request with the module's Zod schema via `validate()` middleware.
- Throw `HttpError(status, message, code?)`; never `res.status().json()` for errors —
  the error middleware formats them.
- Wrap async handlers with `asyncHandler`.
- **Two routing patterns** (both must enforce membership):
  1. *Circle-scoped routes* mounted under `/circles/:circleId/...` with the
     `requireMembership` middleware (e.g. tasks, wallet, business records).
  2. *Top-level resource routes* (e.g. `/api/assets`, `/api/vehicles`,
     `/api/maintenance`, `/api/recurring-expenses`) that use `requireAuth`
     only and re-check membership **inside the service** via the `circleId`
     on the body or resource. List endpoints here are `POST /list` with
     `circleId` in the body.
- **Security:** every circle-scoped action MUST verify membership (middleware
  or in-service). Never trust `circleId`/`assigneeId` from the body without
  checking membership. Hash passwords with bcrypt; never log secrets or tokens.

### Modules (current)
Core: `auth`, `circles`, `invites`, `tasks`, `notifications`.
Household: `inventory`, `shopping-list`, `wallet` (accounts, categories,
transactions, budgets, debts), `assets` (home assets), `recurring-expenses`,
`vehicles`, `maintenance` (auto-creates board tasks).
Vertical: `business` (custom field-defs + records, optionally linked to
wallet transactions and tasks).
Money is stored as **integer minor units** (cents) plus an ISO currency code.

## Frontend (apps/web)
- Vue 3 `<script setup lang="ts">` + Pinia + Vue Router + Tailwind.
- API calls go through `src/lib/api.ts` (single Axios instance) and live in
  **Pinia stores**, not components. Components stay presentational.
- Use the design tokens in `tailwind.config.js` (cozy "Family Hearth" palette:
  `primary` sage, `secondary` dusty-rose, `tertiary` lavender, cream surfaces).
  Do not hardcode hex colours in components — use token classes
  (`bg-primary`, `text-on-surface`, `bg-surface-container`, etc.).
- Icons: Material Symbols Outlined (`<span class="material-symbols-outlined">`).
- Fonts: headings `Plus Jakarta Sans` (`font-headline-*`), body `Be Vietnam Pro`.
- Shapes are rounded (`rounded-lg`/`rounded-xl`/`rounded-full`); avoid sharp corners.
- Mobile-first: columns stack / scroll horizontally; keep tap targets generous.

## Conventions
- TypeScript everywhere; no `any` without a comment justifying it.
- Task statuses are exactly `TODO | DOING | DONE`. Roles are `OWNER | MEMBER`.
- Keep PRs focused on one roadmap milestone.
- **Circle is the tenancy boundary** for every module — always scope new
  models, queries, and routes by `circleId`.
- SQLite has no enums: enum-like fields are stored as `String` and constrained
  in `src/types/domain.ts` + the module's Zod schema. Keep the two in sync.
- Not yet built (keep deferred unless asked): pet management, family calendar,
  shared notes, goal tracking, email/SMS/push delivery.
