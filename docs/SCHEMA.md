# Taskettle — Database Schema

Authoritative source is [`apps/server/prisma/schema.prisma`](../apps/server/prisma/schema.prisma).
This doc explains intent.

```
User ──< Membership >── Circle ──┬──< Task >──────────────────┐
 │            (role)             ├──< Invite                  │
 │                               ├──< InventoryItem ──┐       │
 │                               ├──< ShoppingListItem┼──────┐│
 │                               ├──< WalletAccount   │      ││
 │                               ├──< WalletCategory  │      ││
 │                               ├──< WalletTransaction       ││
 │                               ├──< Budget          │      ││
 │                               └──< Debt            │      ││
 │                                                    ↓      ↓
 └──< Notification ────────────────────────────────────────Task│
                                                          (optional)
```

## Core entities (shared by all modules)

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
| id, name, icon (Material Symbol name), archived, createdAt |

### Membership (User ⇄ Circle)
`@@unique([userId, circleId])`. `role: OWNER | MEMBER`.

### Invite
| id, circleId, email, token (unique), status (PENDING/ACCEPTED/EXPIRED),
  invitedById, expiresAt, createdAt |

### Task
| id, circleId, title, description?, status (TODO/DOING/DONE),
  priority (LOW/MEDIUM/HIGH/URGENT)?, category?, assigneeId?, dueDate?,
  position (float, for ordering), createdById, completedAt?, createdAt, updatedAt |

- `position` is a float so cards can be reordered by inserting between
  neighbours without renumbering.
- `priority` and `category` help households prioritize and organize tasks.
- `completedAt` is set when status → DONE, cleared otherwise.

### Notification
Generic alert row (reused by future modules via `type`).
| id, userId, taskId?, type (DUE_SOON/OVERDUE), message, read, createdAt |
`@@unique([userId, taskId, type])` → dedupes reminders.

---

## Household modules (Phase 1)

### InventoryItem
| id, circleId, name, category, quantity, unit, threshold, location,
  status (IN_STOCK/LOW_STOCK/OUT_OF_STOCK), createdAt, updatedAt |

- `status` is auto-calculated: `IN_STOCK` if qty ≥ threshold; `LOW_STOCK` if 0 < qty < threshold; `OUT_OF_STOCK` if qty = 0.
- `unit` is free-form (e.g., "lbs", "pcs", "bottles"); defaults to "pcs".
- `category` allows grouping (Groceries, Household, Medicine, etc.)

### ShoppingListItem
| id, circleId, name, quantityNeeded, unit?, status (PENDING/PURCHASED),
  inventoryItemId? (foreign key), createdAt, updatedAt |

- Optional `inventoryItemId` links to an `InventoryItem` for quick bulk updates.
- `status` tracks whether item was purchased.

### WalletAccount
| id, circleId, name, type (CASH/BANK/CARD/LOAN/INVESTMENT),
  balanceMinor (integer cents), archived, createdAt, updatedAt |

### WalletCategory
| id, circleId, name, type (INCOME/EXPENSE), icon, createdAt, updatedAt |

### WalletTransaction
| id, circleId, fromAccountId?, toAccountId?, categoryId,
  type (INCOME/EXPENSE/TRANSFER/DEBT_PAYMENT), amountMinor (integer),
  description, date, createdById, createdAt |

- `type` determines which account fields are populated.
- INCOME: `toAccountId` populated. EXPENSE: `fromAccountId` populated. TRANSFER: both. DEBT_PAYMENT: special handling.

### Budget
| id, circleId, categoryId, frequency (WEEKLY/MONTHLY/CUSTOM),
  limitMinor (integer cents), startDate, endDate?, archived, createdAt |

### Debt
| id, circleId, lenderId (User), borrowerId (User), amountMinor (integer cents),
  remainingMinor, description, createdAt, updatedAt |

### DebtPayment
| id, debtId, amountMinor, paidAt, createdAt |

---

## Indexing
- `Task`: index `(circleId, status, position)` for board queries.
- `InventoryItem`: index `(circleId, status)` and `(circleId, category)`.
- `ShoppingListItem`: index `(circleId, status)`.
- `WalletTransaction`: index `(circleId, date)` and `(circleId, categoryId)`.
- `Membership`: index `(circleId)` and `(userId)`.
- `Notification`: index `(userId, read)`.

## Production swap
Change `datasource db { provider = "postgresql" }` and `DATABASE_URL`.
No model changes required; SQLite ↔ Postgres schemas are identical.
