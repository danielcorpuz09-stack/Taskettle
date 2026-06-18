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
{ "id": "...", "type": "DUE_SOON|OVERDUE", "message": "“Water the garden” is overdue",
  "taskId": "...", "read": false, "createdAt": "ISO" }
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
// req { "name": "Household Cash", "type": "CASH", "balanceMinor": 50000 }
// 201 { "account": { ... } }
```

### GET /circles/:circleId/wallet/categories → `{ "categories": [WalletCategory] }`

### GET /circles/:circleId/wallet/transactions → `{ "transactions": [WalletTransaction] }`

### POST /circles/:circleId/wallet/transactions
```json
// req { "type": "EXPENSE", "fromAccountId": "...", "categoryId": "...",
//       "amountMinor": 1500, "description": "Groceries" }
// 201 { "transaction": { ... } }
```

### GET /circles/:circleId/wallet/budgets → `{ "budgets": [Budget] }`

### POST /circles/:circleId/wallet/budgets
```json
// req { "categoryId": "...", "frequency": "MONTHLY", "limitMinor": 100000 }
// 201 { "budget": { ... } }
```

### GET /circles/:circleId/wallet/debts → `{ "debts": [Debt] }`

### POST /circles/:circleId/wallet/debts
```json
// req { "lenderId": "...", "borrowerId": "...", "amountMinor": 5000, "description": "Gas money" }
// 201 { "debt": { ... } }
```

### POST /wallet/debts/:debtId/payments
```json
// req { "amountMinor": 2500 }
// 201 { "payment": { ... }, "debt": { "remainingMinor": 2500 } }
```

### GET /circles/:circleId/wallet/dashboard
```json
// 200 { "dashboard": {
//   "totalBalance": 125000, "income": 50000, "expenses": 15000,
//   "budgetStatus": {...}, "debtsOwedByMe": 0, "debtsOwedToMe": 2500 } }
```
