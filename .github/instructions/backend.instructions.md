---
description: Conventions for the Taskettle Express + Prisma backend.
applyTo: "apps/server/**/*.ts"
---

# Backend instructions

## Layering (strict)
`route → controller → service → prisma`. Prisma is imported only inside
`*.service.ts`. Controllers never contain business logic or DB calls.

## Adding an endpoint
1. Define/extend the Zod schema in `<module>.schema.ts`.
2. Add the business rule in `<module>.service.ts` (pure-ish, returns data/throws).
3. Add a thin controller in `<module>.controller.ts` wrapped with `asyncHandler`.
4. Register the route in `<module>.routes.ts` (see routing patterns below).
5. Document it in `docs/API.md`.

## Routing patterns (pick one, enforce membership either way)
- **Circle-scoped router** mounted under `/circles/:circleId/...`: add the
  `requireMembership` middleware so `circleId` from params is verified before
  the controller runs (tasks, wallet, business records).
- **Top-level resource router** at `/api/<module>`: use `requireAuth` only,
  then re-check membership **inside the service** using the `circleId` from the
  body or the loaded resource (assets, vehicles, maintenance,
  recurring-expenses). List endpoints use `POST /list` with `circleId` in the
  body. Never trust a body `circleId`/`assigneeId` without this check.

## Errors
- Throw `new HttpError(status, message, code?)`. The global error middleware
  shapes `{ error: { message, code } }`. Do not build error JSON in controllers.
- Validation failures are thrown automatically by the `validate()` middleware.

## Security (OWASP-aware)
- Authorization: every circle-scoped action verifies membership — via
  `requireMembership` on circle-scoped routers, or an in-service membership
  lookup on top-level resource routers. Re-check that an `assigneeId` is a
  member of the same circle.
- Hash passwords with bcrypt (cost ≥ 10). Never return `passwordHash`.
- JWT secret comes from `env.JWT_SECRET`; tokens are short-lived.
- Use `helmet`, `cors` (allowlist the web origin), and a body size limit.
- Never log tokens, passwords, or full request bodies containing them.

## Prisma
- One client instance from `src/lib/prisma.ts` (avoid hot-reload leaks).
- Use `select`/`include` to avoid leaking `passwordHash`.
- Keep `position` ordering as floats; compute as midpoint between neighbours.

## Mapping
Convert Prisma rows to API DTOs in the service (e.g. `toTaskDto`) so the HTTP
shape is decoupled from the DB shape.
