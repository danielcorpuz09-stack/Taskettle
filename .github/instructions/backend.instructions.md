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
4. Register the route in `<module>.routes.ts` with `requireAuth` and, when
   circle-scoped, `requireMembership`.
5. Document it in `docs/API.md`.

## Errors
- Throw `new HttpError(status, message, code?)`. The global error middleware
  shapes `{ error: { message, code } }`. Do not build error JSON in controllers.
- Validation failures are thrown automatically by the `validate()` middleware.

## Security (OWASP-aware)
- Authorization: `requireMembership` on every circle/task/notification route.
  Re-check that an `assigneeId` is a member of the same circle.
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
