# Taskettle — Database Schema

Authoritative source is [`apps/server/prisma/schema.prisma`](../apps/server/prisma/schema.prisma).
This doc explains intent.

```
User ──< Membership >── Circle ──┬──< Task >──< Notification
 │                               ├──< Invite
 │                               ├──< InventoryItem ──< ShoppingListItem
 │                               ├──< WalletAccount ──< WalletTransaction
 │                               ├──< WalletCategory ──< Budget
 │                               ├──< Debt ──< DebtPayment
 │                               ├──< HomeAsset            (Phase 2)
 │                               ├──< RecurringExpense     (Phase 2)
 │                               ├──< Vehicle              (Phase 2)
 │                               ├──< MaintenanceSchedule  (Phase 2, ──> Task)
 │                               └──< Business ──┬──< BusinessFieldDef   (Phase 3)
 │                                               └──< BusinessRecord ──< BusinessFieldValue
 └──< Notification
```

WalletTransaction, BusinessRecord and MaintenanceSchedule can optionally bridge
across modules (transaction ↔ record ↔ task). Debt payments optionally link to a
wallet transaction.

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
Generic alert row (reused across modules via `type`).
| id, userId, taskId?, debtId?, type (DUE_SOON/OVERDUE/DEBT_DUE_SOON/DEBT_OVERDUE),
  message, read, createdAt |
`@@unique([userId, taskId, type])` and `@@unique([userId, debtId, type])` →
dedupe reminders.

---

## Household modules (Phase 1)

### InventoryItem
| id, circleId, name, description?, category?, quantity, unit?, minimumThreshold,
  location?, notes?, status (IN_STOCK/LOW_STOCK/OUT_OF_STOCK), createdById,
  createdAt, updatedAt |

- `status` is auto-calculated: `IN_STOCK` if qty ≥ threshold; `LOW_STOCK` if 0 < qty < threshold; `OUT_OF_STOCK` if qty = 0.
- `unit` is free-form (e.g., "lbs", "pcs", "bottles").
- `category` allows grouping (Groceries, Household, Medicine, etc.)

### ShoppingListItem
| id, circleId, name, quantityNeeded, unit?, status (PENDING/PURCHASED),
  inventoryItemId? (foreign key), createdAt, updatedAt |

- Optional `inventoryItemId` links to an `InventoryItem` for quick bulk updates.
- `status` tracks whether item was purchased.

### WalletAccount
| id, circleId, name, type (CASH/BANK/CARD/SAVINGS/OTHER),
  currency (ISO code), ownerId?, archivedAt?, createdAt, updatedAt |

- No stored balance: each account's balance is **computed** from its
  transactions (`balanceEffect(type, amountMinor)`), so it cannot be tampered
  with from the client.

### WalletCategory
| id, circleId, name, type (INCOME/EXPENSE), color, icon, createdAt |
`@@unique([circleId, name, type])`.

### WalletTransaction
| id, circleId, accountId, type (INCOME/EXPENSE/TRANSFER/DEBT_PAYMENT),
  amountMinor (integer), currency, categoryId?, note?, payee?, transactionDate,
  createdById, debtId?, createdAt, updatedAt |

- `amountMinor` is always positive; `balanceEffect(type, amount)` decides the
  sign when computing account balances.
- `debtId` optionally links a transaction to a `Debt` (e.g. a debt payment).

### Budget
| id, circleId, name, categoryId?, amountMinor (integer cents), currency,
  period (WEEKLY/MONTHLY/CUSTOM), startsAt, endsAt?, createdById, archivedAt?,
  createdAt, updatedAt |

- The budget window is derived from `period` (current week / current month, or
  `startsAt`–`endsAt` for `CUSTOM`); `spentMinor` is computed from transactions.

### Debt
| id, circleId, lenderId (User), borrowerId (User), amountMinor (integer cents),
  currency, reason?, dueDate?, status (OPEN/PARTIALLY_PAID/PAID/CANCELLED),
  createdById, paidAt?, createdAt, updatedAt |

- The remaining balance is computed from `payments`; `status` is derived
  (`OPEN` → `PARTIALLY_PAID` → `PAID`, or `CANCELLED`).
- Visible to the lender, borrower, or creator.

### DebtPayment
| id, debtId, amountMinor, currency, paidById, paidToId, paidAt,
  walletTransactionId? (unique), createdAt |

- Optionally links to a `WalletTransaction` so the payment shows in a ledger.

---

## Home management modules (Phase 2)

All four are circle-scoped via the resource's `circleId`.

### HomeAsset
| id, circleId, name, category (APPLIANCE/ELECTRONICS/FURNITURE/POWER_TOOL/OTHER),
  purchaseDate?, warrantyExpiration?, serialNumber?, receiptPhotoUrls? (JSON
  array string), currentValue? (minor units), notes?, createdById, createdAt,
  updatedAt |

### RecurringExpense
| id, circleId, name, category (UTILITY/SUBSCRIPTION), amountMinor, currency,
  dueDate? (day of month 1–31), frequency (MONTHLY/QUARTERLY/ANNUAL), autoPay,
  notes?, lastOccurred?, nextDue?, createdById, createdAt, updatedAt |

### Vehicle
| id, circleId, name, model?, plateNumber?, registrationExpiry?, insuranceExpiry?,
  notes?, createdById, createdAt, updatedAt |

### MaintenanceSchedule
| id, circleId, title, description?, frequency (WEEKLY/MONTHLY/QUARTERLY/ANNUAL/
  CUSTOM), nextDueDate, assigneeId?, lastTaskId?, notes?, createdById, createdAt,
  updatedAt |

- When due, the service auto-creates a board `Task`; `lastTaskId` dedupes so a
  single occurrence only spawns one task.

---

## Vertical module (Phase 3)

### Business
| id, circleId, name, businessType (free-text), description?, currency,
  archivedAt?, createdById, createdAt, updatedAt |

### BusinessFieldDef
A typed custom field for a business.
| id, businessId, name, key (slug), fieldType (TEXT/NUMBER/CURRENCY/DATE/SELECT/
  BOOLEAN/URL), options? (JSON for SELECT), unit?, isRequired, showInAnalytics,
  position (float), createdById, createdAt, updatedAt |
`@@unique([businessId, key])`.

### BusinessRecord
| id, businessId, circleId (denormalized), recordType (INCOME/EXPENSE/ORDER/
  SERVICE/RENTAL_PERIOD/OTHER), title, amountMinor?, currency?, note?, recordDate,
  walletTransactionId? (unique), taskId? (unique), createdById, createdAt,
  updatedAt |

- Optionally bridges to a `WalletTransaction` and/or a board `Task`.

### BusinessFieldValue
| id, recordId, fieldDefId, value (string, parsed by `fieldType`), createdAt,
  updatedAt |
`@@unique([recordId, fieldDefId])`.

---

## Indexing
- `Task`: index `(circleId, status, position)` for board queries and `(dueDate)`.
- `InventoryItem`: index `(circleId, status)` and `(circleId, category)`.
- `ShoppingListItem`: index `(circleId, status)`.
- `WalletTransaction`: index `(circleId, transactionDate)`, `(circleId, accountId)` and `(circleId, categoryId)`.
- `Debt`: index `(circleId, status)`, `(lenderId)`, `(borrowerId)`.
- `HomeAsset`: index `(circleId, category)` and `(circleId, warrantyExpiration)`.
- `RecurringExpense`: index `(circleId, category)` and `(circleId, nextDue)`.
- `Vehicle`: index `(circleId)`, `(registrationExpiry)`, `(insuranceExpiry)`.
- `MaintenanceSchedule`: index `(circleId, nextDueDate)`.
- `BusinessRecord`: index `(businessId, recordDate)`, `(circleId, recordDate)`, `(businessId, recordType)`.
- `Membership`: index `(circleId)` and `(userId)`.
- `Notification`: index `(userId, read)`.

## Enum-like fields
SQLite has no native enums, so enum-like columns are stored as `String`. Allowed
values are listed at the top of `schema.prisma` and enforced in
`src/types/domain.ts` plus each module's Zod schema — keep all three in sync.

## Production swap
Change `datasource db { provider = "postgresql" }` and `DATABASE_URL`.
No model changes required; SQLite ↔ Postgres schemas are identical.
