---
name: taskettle-feature
description: >
  Workflow for adding a new feature or module to Taskettle (Vue 3 + Express +
  Prisma monorepo). Use when implementing a roadmap milestone, adding an API
  endpoint, a new domain model, a board capability, or a future module
  (inventory, calendar, etc.). Walks the full vertical slice from Prisma model
  to Pinia store while respecting the cozy design system and circle-scoped auth.
---

# Skill: Add a Taskettle feature (vertical slice)

Follow this order so each layer compiles before the next.

## 1. Confirm it belongs in the MVP
Check `ROADMAP.md`. If the request is not in the current milestone and does not
help validate the MVP, recommend postponing to Post-MVP before coding.

## 2. Data layer (`apps/server/prisma/schema.prisma`)
- Add/extend the model. Scope domain data to a `Circle` (the tenancy boundary).
- Add indexes for query paths. Run `npm run db:migrate -- --name <change>`.

## 3. Backend slice (`apps/server/src/modules/<name>/`)
Create four files:
- `<name>.schema.ts` — Zod request schemas.
- `<name>.service.ts` — business rules + Prisma access + `toXDto` mappers.
- `<name>.controller.ts` — thin handlers wrapped in `asyncHandler`.
- `<name>.routes.ts` — `requireAuth` + `requireMembership` + `validate(schema)`.
Register the router in `src/app.ts`. Throw `HttpError`, never hand-build JSON.

## 4. Contract
Update `docs/API.md` with request/response examples.

## 5. Frontend slice (`apps/web/src/`)
- Add types to `src/types/`.
- Add/extend a Pinia store calling `lib/api.ts` (optimistic + rollback).
- Build presentational components using cozy Tailwind tokens
  (`bg-primary`, `font-headline-lg`, `rounded-xl`, Material Symbols).
- Wire a view/route; add a router guard if it needs auth.

## 6. Verify
- `npm run build` (root) for type checks.
- Manually: register → create circle → exercise the feature.
- Confirm a non-member gets 403 (authorization holds).

## Checklist
- [ ] Circle-scoped & membership-guarded
- [ ] Zod-validated input
- [ ] No `passwordHash`/secrets leaked in responses or logs
- [ ] Design tokens only (no hardcoded hex)
- [ ] Mobile layout verified
- [ ] `docs/API.md` updated
