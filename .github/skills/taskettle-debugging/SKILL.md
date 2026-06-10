---
name: taskettle-debugging
description: >
  Diagnostic playbook for debugging Taskettle (Vue 3 frontend + Express/Prisma
  backend monorepo). Use when something is broken: API 4xx/5xx errors, auth/401
  loops, CORS failures, Prisma/migration errors, the kanban board not updating,
  drag-and-drop glitches, or reminders not appearing. Provides the layer-by-layer
  triage order and the most common root causes.
---

# Skill: Debug Taskettle

Work outside-in: reproduce, isolate the layer, then fix the lowest broken layer.

## Triage order
1. **Browser console + Network tab** — is the request sent? what status?
2. **API response body** — `{ error: { message, code } }` tells you the layer.
3. **Server logs** (morgan + error middleware stack).
4. **Database** — `npx prisma studio` (run in `apps/server`) to inspect rows.

## Symptom → likely cause

### 401 / redirected to Sign In
- Missing/expired JWT. Check `auth` store token and the `Authorization` header
  in `lib/api.ts`. A global 401 interceptor logs out — confirm the token is
  actually present before blaming the server.
- `JWT_SECRET` changed between restarts → all old tokens invalid. Re-login.

### 403 on a circle/task action
- Authorization working as designed: caller is not a member of that circle.
  Verify `requireMembership` is reading the right `circleId` (params vs body)
  and that a membership row exists.

### 400 validation error
- Zod rejected the body. The message lists the failing field. Align the
  frontend payload with `<module>.schema.ts`.

### CORS error in browser
- `CORS_ORIGIN` in `apps/server/.env` must match the web origin
  (`http://localhost:5173`). Restart the server after changing env.

### Prisma errors
- `P2002` unique constraint (e.g. duplicate email/invite/notification dedupe).
- "migration needed" / drift → `npm run db:migrate`. For a clobbered dev DB,
  delete `apps/server/prisma/dev.db` and re-migrate + seed.
- Client out of date after schema edit → `npx prisma generate`.

### Board doesn't update after drag
- Optimistic update applied but PATCH failed → store should roll back. Check
  the `board` store's catch branch and the `PATCH /tasks/:id` payload
  (`status`, `position`). Position is a float midpoint between neighbours.

### Reminders never show
- Cron job: confirm it started (log on boot) and the interval in env.
- Notifications are deduped via `@@unique([userId, taskId, type])` — an existing
  row means it already fired. Check `dueDate` is in range and status ≠ DONE.
- Frontend polls every 60s; check the `notifications` store interval is running.

## Useful commands
```bash
# from repo root
npm run dev                       # both apps
# from apps/server
npx prisma studio                 # inspect DB
npx prisma migrate reset          # wipe + re-migrate + seed (DEV ONLY)
npx prisma generate               # regenerate client after schema change
```

## When stuck
Add a focused log in the service (not the controller), reproduce once, then
remove it. Don't retry the same fix twice — move down a layer.
