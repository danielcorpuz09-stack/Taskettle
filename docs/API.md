# Taskettle — API Contract (v1)

Base URL: `/api`
Auth: `Authorization: Bearer <accessToken>` on every route except register/login.
All responses are JSON. Errors use:

```json
{ "error": { "message": "Human readable", "code": "OPTIONAL_CODE" } }
```

Status codes: `400` validation, `401` unauthenticated, `403` not a member,
`404` not found, `409` conflict (e.g. email taken), `500` server.

---

## Auth

### POST /auth/register
```json
// req
{ "name": "Mei", "email": "mei@taskettle.app", "password": "password123" }
// 201
{ "user": { "id": "...", "name": "Mei", "email": "...", "avatarColor": "#8fa998" },
  "accessToken": "jwt..." }
```

### POST /auth/login
```json
// req
{ "email": "mei@taskettle.app", "password": "password123" }
// 200
{ "user": { ... }, "accessToken": "jwt..." }
```

### GET /auth/me  → `200 { "user": { ... } }`

---

## Circles

### GET /circles → circles the caller belongs to
```json
{ "circles": [ { "id": "...", "name": "Family Circle", "icon": "family_history",
  "role": "OWNER", "memberCount": 4 } ] }
```

### POST /circles
```json
// req { "name": "Family Circle", "icon": "family_history" }
// 201 { "circle": { "id": "...", "name": "...", "icon": "...", "role": "OWNER" } }
```

### GET /circles/:circleId → `{ "circle": { ...summary, "members": [Member] } }`

### GET /circles/:circleId/members
```json
{ "members": [ { "userId": "...", "name": "Mei", "email": "...",
  "avatarColor": "#8fa998", "role": "OWNER" } ] }
```

---

## Invitations

### POST /circles/:circleId/invites  (member+)
```json
// req { "email": "satsuki@taskettle.app" }
// 201 { "invite": { "id": "...", "email": "...", "token": "...",
//                   "status": "PENDING", "expiresAt": "ISO" } }
```

### POST /invites/:token/accept  (auth required; joins caller to the circle)
```json
// 200 { "circle": { "id": "...", "name": "...", "role": "MEMBER" } }
```

---

## Tasks

Task shape:
```json
{ "id": "...", "circleId": "...", "title": "Water the garden",
  "description": "Back beds + herbs", "status": "TODO|DOING|DONE",
  "assignee": { "userId": "...", "name": "...", "avatarColor": "..." } | null,
  "dueDate": "ISO" | null, "position": 1024,
  "createdById": "...", "completedAt": "ISO" | null,
  "createdAt": "ISO", "updatedAt": "ISO" }
```

### GET /circles/:circleId/tasks → `{ "tasks": [Task] }` (all statuses, ordered)

### POST /circles/:circleId/tasks
```json
// req { "title": "Water the garden", "description": "...",
//       "assigneeId": "..."|null, "dueDate": "ISO"|null }
// 201 { "task": Task }   // status defaults to TODO
```

### PATCH /tasks/:taskId  (partial; used for move/assign/edit/complete)
```json
// req (any subset)
{ "title": "...", "description": "...", "status": "DOING",
  "assigneeId": "..."|null, "dueDate": "ISO"|null, "position": 2048 }
// 200 { "task": Task }
```

### DELETE /tasks/:taskId → `204`

---

## Notifications (reminders)

```json
{ "id": "...", "type": "DUE_SOON|OVERDUE", "message": "“Water the garden” is overdue",
  "taskId": "...", "read": false, "createdAt": "ISO" }
```

### GET /notifications → `{ "notifications": [Notification], "unread": 2 }`
### PATCH /notifications/:id/read → `200 { "notification": { ...read:true } }`
### POST /notifications/read-all → `200 { "updated": 5 }`
