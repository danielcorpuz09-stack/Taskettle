# Taskettle — Database Schema

Authoritative source is [`apps/server/prisma/schema.prisma`](../apps/server/prisma/schema.prisma).
This doc explains intent.

```
User ──< Membership >── Circle
 │            (role)        │
 │                         ├──< Task >── (assignee → User)
 │                         └──< Invite
 └──< Notification >── Task
```

## Entities

### User
| field | type | notes |
|-------|------|-------|
| id | cuid | PK |
| email | string | unique, lowercased |
| passwordHash | string | bcrypt |
| name | string | display name |
| avatarColor | string | pastel hex assigned at signup |
| createdAt | datetime | |

### Circle
A group / household. The tenancy boundary for all current & future modules.
| id, name, icon (Material Symbol name), createdAt |

### Membership (User ⇄ Circle)
`@@unique([userId, circleId])`. `role: OWNER | MEMBER`.

### Invite
| id, circleId, email, token (unique), status (PENDING/ACCEPTED/EXPIRED),
  invitedById, expiresAt, createdAt |

### Task
| id, circleId, title, description?, status (TODO/DOING/DONE),
  assigneeId?, dueDate?, position (float, for ordering),
  createdById, completedAt?, createdAt, updatedAt |

- `position` is a float so cards can be reordered by inserting between
  neighbours (avg of siblings) without renumbering the column.
- `completedAt` is set when status → DONE, cleared otherwise.

### Notification
Generic alert row (reused by future modules via `type`).
| id, userId, taskId?, type (DUE_SOON/OVERDUE), message, read, createdAt |
`@@unique([userId, taskId, type])` → dedupes reminders.

## Indexing
- `Task`: index `(circleId, status, position)` for board queries.
- `Membership`: index `(circleId)` and `(userId)`.
- `Notification`: index `(userId, read)`.

## Production swap
Change `datasource db { provider = "postgresql" }` and `DATABASE_URL`.
No model changes required.
