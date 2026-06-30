# Taskettle — API Contract (v1)

Base URL: `/api`
Auth: `Authorization: Bearer <accessToken>` on every route except register/login.
All responses are JSON. Errors use:

```json
{ "error": { "message": "Human readable", "code": "OPTIONAL_CODE" } }
```

Status codes: `400` validation, `401` unauthenticated, `403` not a member,
`404` not found, `409` conflict (e.g. email taken), `500` server.

**Routing conventions.** Two patterns are used:
- *Circle-scoped* resources are mounted under `/circles/:circleId/...` and
  enforce membership via middleware (auth, circles, invites, tasks, inventory,
  shopping-list, wallet, business reads/creates).
- *Top-level resource* routes (`/assets`, `/recurring-expenses`, `/vehicles`,
  `/maintenance`) take `circleId` in the request body and re-check membership in
  the service. Their list endpoint is `POST /list` (not `GET`).

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
  "priority": "LOW|MEDIUM|HIGH|URGENT"|null, "category": "Chores|Errands|..."|null,
  "assignee": { "userId": "...", "name": "...", "avatarColor": "..." } | null,
  "dueDate": "ISO" | null, "position": 1024,
  "createdById": "...", "completedAt": "ISO" | null,
  "createdAt": "ISO", "updatedAt": "ISO" }
```

### GET /circles/:circleId/tasks → `{ "tasks": [Task] }` (all statuses, ordered)

### POST /circles/:circleId/tasks
```json
// req { "title": "Water the garden", "description": "...",
//       "assigneeId": "..."|null, "dueDate": "ISO"|null,
//       "priority": "LOW|MEDIUM|HIGH|URGENT"|null, "category": "..."|null }
// 201 { "task": Task }   // status defaults to TODO
```

### PATCH /tasks/:taskId  (partial; used for move/assign/edit/complete)
```json
// req (any subset)
{ "title": "...", "description": "...", "status": "DOING",
  "priority": "HIGH", "category": "Errands",
  "assigneeId": "..."|null, "dueDate": "ISO"|null, "position": 2048 }
// 200 { "task": Task }
```

### DELETE /tasks/:taskId → `204`

---

## Notifications (reminders)

```json
{ "id": "...", "type": "DUE_SOON|OVERDUE|DEBT_DUE_SOON|DEBT_OVERDUE",
  "message": "“Water the garden” is overdue",
  "taskId": "..."|null, "debtId": "..."|null, "read": false, "createdAt": "ISO" }
```

### GET /notifications → `{ "notifications": [Notification], "unread": 2 }`
### PATCH /notifications/:id/read → `200 { "notification": { ...read:true } }`
### POST /notifications/read-all → `200 { "updated": 5 }`

---

## Inventory

### GET /circles/:circleId/inventory → `{ "items": [InventoryItem] }`

### POST /circles/:circleId/inventory
```json
// req { "name": "Milk", "category": "Groceries", "quantity": 2, "unit": "gallons", "threshold": 1 }
// 201 { "item": { "id": "...", "name": "...", "status": "IN_STOCK", ... } }
```

### PATCH /inventory/:itemId
```json
// req (any subset) { "quantity": 1, "category": "...", ... }
// 200 { "item": { ... } }
```

### DELETE /inventory/:itemId → `204`

### POST /circles/:circleId/inventory/add-to-shopping
```json
// req { "inventoryItemId": "...", "quantity": 1 }
// 201 { "shoppingItem": { ... } }
```

### GET /circles/:circleId/inventory/dashboard
```json
// 200 { "dashboard": {
//   "total": 42, "inStock": 30, "lowStock": 8, "outOfStock": 4,
//   "recentItems": [...] } }
```

---

## Shopping List

### GET /circles/:circleId/shopping-list → `{ "items": [ShoppingListItem] }`

### POST /circles/:circleId/shopping-list
```json
// req { "name": "Eggs", "quantityNeeded": 12, "unit": "pcs" }
// 201 { "item": { "id": "...", "status": "PENDING", ... } }
```

### PATCH /shopping-list/:itemId
```json
// req { "status": "PURCHASED", "quantityNeeded": 6 }
// 200 { "item": { ... } }
```

### DELETE /shopping-list/:itemId → `204`

---

## Wallet

### GET /circles/:circleId/wallet/accounts → `{ "accounts": [WalletAccount] }`

### POST /circles/:circleId/wallet/accounts
```json
// req { "name": "Household Cash", "type": "CASH", "currency": "USD", "ownerId": null }
// type: CASH | BANK | CARD | SAVINGS | OTHER. Balance is computed from
// transactions, never set directly.
// 201 { "account": { ... } }
```

### GET /circles/:circleId/wallet/categories → `{ "categories": [WalletCategory] }`

### GET /circles/:circleId/wallet/transactions → `{ "transactions": [WalletTransaction] }`
Optional query: `accountId`, `categoryId`, `type`, `search`, `from` (ISO), `to` (ISO).

### POST /circles/:circleId/wallet/transactions
```json
// req { "type": "EXPENSE", "accountId": "...", "categoryId": "..."|null,
//       "amountMinor": 1500, "currency": "USD", "note": "Groceries",
//       "payee": "SuperMart", "transactionDate": "ISO" }
// type: INCOME | EXPENSE | TRANSFER | DEBT_PAYMENT
// 201 { "transaction": { ... } }
```

### GET /circles/:circleId/wallet/budgets → `{ "budgets": [Budget] }`
Optional query: `accountId` (scopes each budget's `spentMinor` to one account).

### POST /circles/:circleId/wallet/budgets
```json
// req { "name": "Groceries", "categoryId": "..."|null, "amountMinor": 100000,
//       "currency": "USD", "period": "MONTHLY", "startsAt": "ISO", "endsAt": null }
// period: WEEKLY | MONTHLY | CUSTOM
// 201 { "budget": { ... } }
```

### GET /circles/:circleId/wallet/debts → `{ "debts": [Debt] }`

### POST /circles/:circleId/wallet/debts
```json
// req { "lenderId": "...", "borrowerId": "...", "amountMinor": 5000,
//       "currency": "USD", "reason": "Gas money", "dueDate": "ISO"|null }
// 201 { "debt": { ... } }
```

### POST /wallet/debts/:debtId/payments
```json
// req { "amountMinor": 2500 }
// 201 { "payment": { ... }, "debt": { "remainingMinor": 2500 } }
```

### GET /circles/:circleId/wallet/dashboard
Optional query: `accountId`, `from` (ISO), `to` (ISO). When omitted, totals cover the current calendar month and all active accounts.
```json
// 200 { "dashboard": {
//   "totalBalance": 125000, "income": 50000, "expenses": 15000,
//   "budgetStatus": {...}, "debtsOwedByMe": 0, "debtsOwedToMe": 2500 } }
```

### GET /circles/:circleId/wallet/analytics
Aggregated insights for charts. Optional query: `accountId`, `from` (ISO), `to` (ISO). When omitted, the window defaults to the last 6 calendar months. Spending/flow buckets count transactions inside the window; `balanceTrend` is cumulative across all prior transactions.
```json
// 200 { "analytics": {
//   "currency": "USD",
//   "rangeStart": "2026-01-01T00:00:00.000Z",
//   "rangeEnd": "2026-07-01T00:00:00.000Z",
//   "spendingByCategory": [{ "categoryId": "...", "name": "Groceries", "color": "#8fa998", "icon": "shopping_cart", "totalMinor": 42000 }],
//   "incomeExpenseByMonth": [{ "month": "2026-06", "incomeMinor": 50000, "expenseMinor": 15000, "netMinor": 35000 }],
//   "balanceTrend": [{ "month": "2026-06", "balanceMinor": 125000 }],
//   "topPayees": [{ "payee": "SuperMart", "totalMinor": 18000, "count": 4 }]
// } }
```

---

## Home Assets

Top-level routes (`requireAuth`; membership re-checked via the `circleId`).

Asset shape:
```json
{ "id": "...", "circleId": "...", "name": "Fridge", "category": "APPLIANCE",
  "purchaseDate": "ISO"|null, "warrantyExpiration": "ISO"|null,
  "serialNumber": "..."|null, "receiptPhotoUrls": ["..."]|null,
  "currentValue": 0|null, "notes": "..."|null,
  "createdById": "...", "createdAt": "ISO", "updatedAt": "ISO" }
```
`category`: `APPLIANCE | ELECTRONICS | FURNITURE | POWER_TOOL | OTHER`.

### POST /assets
```json
// req { "circleId": "...", "name": "Fridge", "category": "APPLIANCE",
//       "purchaseDate": "ISO", "warrantyExpiration": "ISO",
//       "serialNumber": "...", "receiptPhotoUrls": ["..."], "currentValue": 0, "notes": "..." }
// 201 { "asset": Asset }
```

### POST /assets/list
```json
// req { "circleId": "...", "category": "APPLIANCE" }   // category optional
// 200 { "assets": [Asset] }
```

### GET /assets/:assetId → `{ "asset": Asset }`
### PATCH /assets/:assetId  (any subset of create fields except circleId) → `{ "asset": Asset }`
### DELETE /assets/:assetId → `204`

---

## Recurring Expenses

Top-level routes (`requireAuth`; membership re-checked via the `circleId`).

Shape:
```json
{ "id": "...", "circleId": "...", "name": "Electricity", "category": "UTILITY",
  "amountMinor": 4280, "currency": "USD", "dueDate": 15|null,
  "frequency": "MONTHLY", "autoPay": false, "notes": "..."|null,
  "lastOccurred": "ISO"|null, "nextDue": "ISO"|null,
  "createdById": "...", "createdAt": "ISO", "updatedAt": "ISO" }
```
`category`: `UTILITY | SUBSCRIPTION`. `frequency`: `MONTHLY | QUARTERLY | ANNUAL`.
`dueDate` is a day-of-month (1–31) or null.

### POST /recurring-expenses
```json
// req { "circleId": "...", "name": "Netflix", "category": "SUBSCRIPTION",
//       "amountMinor": 1599, "currency": "USD", "dueDate": 1,
//       "frequency": "MONTHLY", "autoPay": true, "notes": "..." }
// 201 { "expense": RecurringExpense }
```

### POST /recurring-expenses/list
```json
// req { "circleId": "...", "category": "SUBSCRIPTION" }   // category optional
// 200 { "expenses": [RecurringExpense] }
```

### GET /recurring-expenses/:expenseId → `{ "expense": RecurringExpense }`
### PATCH /recurring-expenses/:expenseId  (subset; no circleId) → `{ "expense": RecurringExpense }`
### DELETE /recurring-expenses/:expenseId → `204`

---

## Vehicles

Top-level routes (`requireAuth`; membership re-checked via the `circleId`).

Shape:
```json
{ "id": "...", "circleId": "...", "name": "Family Van", "model": "..."|null,
  "plateNumber": "..."|null, "registrationExpiry": "ISO"|null,
  "insuranceExpiry": "ISO"|null, "notes": "..."|null,
  "createdById": "...", "createdAt": "ISO", "updatedAt": "ISO" }
```

### POST /vehicles
```json
// req { "circleId": "...", "name": "Family Van", "model": "Toyota Hiace",
//       "plateNumber": "ABC 123", "registrationExpiry": "ISO",
//       "insuranceExpiry": "ISO", "notes": "..." }
// 201 { "vehicle": Vehicle }
```

### POST /vehicles/list
```json
// req { "circleId": "..." }
// 200 { "vehicles": [Vehicle] }
```

### GET /vehicles/:vehicleId → `{ "vehicle": Vehicle }`
### PATCH /vehicles/:vehicleId  (subset; no circleId) → `{ "vehicle": Vehicle }`
### DELETE /vehicles/:vehicleId → `204`

---

## Maintenance

Top-level routes (`requireAuth`; membership re-checked via the `circleId`).
When a schedule is due, the service auto-creates a board task (deduped via
`lastTaskId`).

Shape:
```json
{ "id": "...", "circleId": "...", "title": "Aircon cleaning",
  "description": "..."|null, "frequency": "QUARTERLY", "nextDueDate": "ISO",
  "assigneeId": "..."|null, "lastTaskId": "..."|null, "notes": "..."|null,
  "createdById": "...", "createdAt": "ISO", "updatedAt": "ISO" }
```
`frequency`: `WEEKLY | MONTHLY | QUARTERLY | ANNUAL | CUSTOM`.

### POST /maintenance
```json
// req { "circleId": "...", "title": "Aircon cleaning", "description": "...",
//       "frequency": "QUARTERLY", "nextDueDate": "ISO",
//       "assigneeId": "..."|null, "notes": "..." }
// 201 { "schedule": MaintenanceSchedule }
```

### POST /maintenance/list
```json
// req { "circleId": "..." }
// 200 { "schedules": [MaintenanceSchedule] }
```

### GET /maintenance/:scheduleId → `{ "schedule": MaintenanceSchedule }`
### PATCH /maintenance/:scheduleId  (subset; no circleId) → `{ "schedule": MaintenanceSchedule }`
### DELETE /maintenance/:scheduleId → `204`

---

## Business

A flexible records system. Reads/creates are circle-scoped (membership via
middleware); mutations are resource-scoped (`requireAuth`, membership re-checked
in the service).

### GET /circles/:circleId/businesses → `{ "businesses": [Business] }`

### POST /circles/:circleId/businesses
```json
// req { "name": "Print Shop", "businessType": "PRINT_SHOP",
//       "description": "...", "currency": "USD" }
// 201 { "business": { ... } }
```

### PATCH /businesses/:businessId  (subset; supports archivedAt) → `{ "business": { ... } }`
### DELETE /businesses/:businessId → `204`

### Custom field definitions

### GET /circles/:circleId/businesses/:businessId/field-defs → `{ "fieldDefs": [FieldDef] }`

### POST /circles/:circleId/businesses/:businessId/field-defs
```json
// req { "name": "Quantity", "key": "quantity", "fieldType": "NUMBER",
//       "options": null, "unit": "pcs", "isRequired": false, "showInAnalytics": true }
// fieldType: TEXT | NUMBER | CURRENCY | DATE | SELECT | BOOLEAN | URL
// SELECT requires `options` (comma-separated). 201 { "fieldDef": { ... } }
```

### PATCH /businesses/:businessId/field-defs/:fieldDefId → `{ "fieldDef": { ... } }`
### DELETE /businesses/:businessId/field-defs/:fieldDefId → `204`

### Records

### GET /circles/:circleId/businesses/:businessId/records → `{ "records": [Record] }`

### POST /circles/:circleId/businesses/:businessId/records
```json
// req { "recordType": "ORDER", "title": "Banner order", "amountMinor": 50000,
//       "currency": "USD", "note": "...", "recordDate": "ISO",
//       "fieldValues": [{ "fieldDefId": "...", "value": "10" }],
//       "createTask": true, "taskAssigneeId": "..."|null, "taskDueDate": "ISO"|null }
// recordType: INCOME | EXPENSE | ORDER | SERVICE | RENTAL_PERIOD | OTHER
// When createTask is true a linked board task is created. 201 { "record": { ... } }
```

### PATCH /businesses/records/:recordId  (subset) → `{ "record": { ... } }`
### DELETE /businesses/records/:recordId → `204`

### GET /circles/:circleId/businesses/:businessId/analytics
Optional query: `from` (ISO), `to` (ISO), `period` (`day|week|month`),
`groupBy` (a field-def key). Returns aggregated totals over records.
