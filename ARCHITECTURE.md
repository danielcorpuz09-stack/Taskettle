# Taskettle — Architecture

## 1. Goals & non-goals

**Goals (MVP):** validate that small groups will coordinate tasks in a warm,
non-corporate tool. Ship a production-ready, maintainable, mobile-responsive
first version.

**Non-goals (MVP):** real-time collaboration, push/email delivery, OAuth,
billing, the future modules (inventory, medicine, calendar, notes, goals).

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

The core security rule: **every task/member/notification action is scoped to a
Circle the user belongs to.** A `requireMembership(circleId)` guard loads the
caller's membership and rejects non-members (OWASP A01 – broken access control).

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

- **Views** = routed pages (`SignIn`, `Register`, `Board`, `Circles`).
- **Stores** (Pinia): `auth`, `board`, `notifications`. Stores own API calls;
  components stay presentational.
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

## 8. Extensibility seams

- New domain = new `modules/<x>` folder + Prisma model + Pinia store + route.
- Notifications table is generic (`type`) → reuse for calendar/medicine alerts.
- Circle membership is the universal tenancy boundary all future modules share.
