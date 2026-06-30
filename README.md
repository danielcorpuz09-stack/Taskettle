# 🫖 Taskettle

> Effortless coordination for your household and circles.

Taskettle is a cozy, family-friendly task board — Trello's calm cousin, built for
families, roommates, and small groups instead of corporations. Plan chores,
summer activities, DIY and home-improvement projects together.

## ✨ Features

**Core task board (MVP)**
- Create a **Circle** (a group / household)
- **Invite members** by email
- **Create & assign tasks** with due dates, priority and category
- Move tasks between **Todo → Doing → Done** (drag & drop)
- **Reminders** for tasks that are due soon or overdue

**Household management**
- **Inventory** — track stock levels, categories and low-stock alerts
- **Shopping list** — collaborative list linked to inventory, with purchase tracking
- **Wallet** — accounts, categories, transactions, budgets, debts + insights charts
- **Home assets** — appliances, electronics, furniture, tools with warranty tracking
- **Recurring expenses** — utility bills & subscriptions with monthly summaries
- **Vehicles** — registration / insurance expiry tracking per vehicle
- **Maintenance** — recurring household upkeep that auto-creates board tasks

**Vertical**
- **Business** — flexible custom records (custom field definitions) optionally
  linked to wallet transactions and board tasks

Everything is scoped to a **Circle**, the shared tenancy boundary.

## 🧱 Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | Vue 3 + TypeScript + Vite | Fast DX, typed, small footprint |
| State | Pinia | Simple, typed stores |
| Styling | Tailwind CSS (cozy design tokens) | Matches Stitch design system |
| Drag & drop | vuedraggable | Battle-tested kanban DnD |
| Backend | Node + Express + TypeScript | Familiar, flexible |
| ORM | Prisma | Type-safe, easy Postgres swap |
| DB (dev) | SQLite | Zero-config local dev |
| Auth | JWT + bcrypt | Stateless, simple |
| Validation | Zod | Shared, typed schemas |
| Reminders | node-cron | No infra, runs in-process |

## 📂 Structure

```
taskettle/
├── apps/
│   ├── server/   # Express + Prisma API
│   └── web/      # Vue 3 SPA
├── docs/         # API + schema reference
├── .github/      # Copilot instructions & skills
├── ARCHITECTURE.md
└── ROADMAP.md
```

## 🚀 Getting started

```bash
# 1. install everything (workspaces)
npm install

# 2. set up the backend env + database
cp apps/server/.env.example apps/server/.env
npm run db:migrate
npm run db:seed        # optional demo data

# 3. run frontend + backend together
npm run dev
```

- Web: http://localhost:5173
- API: http://localhost:4000/api

Demo login after seeding: `mei@taskettle.app` / `password123`

See [ARCHITECTURE.md](ARCHITECTURE.md), [ROADMAP.md](ROADMAP.md) and
[docs/API.md](docs/API.md) for the full design.
