// Domain enums. SQLite can't store Prisma enums, so the DB columns are String;
// these union types are the single source of truth at the type level.

export type Role = 'OWNER' | 'MEMBER';
export type TaskStatus = 'BACKLOG' | 'TODO' | 'DOING' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskRecurrence = 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED';
export type NotificationType = 'DUE_SOON' | 'OVERDUE' | 'DEBT_DUE_SOON' | 'DEBT_OVERDUE';
export type InventoryStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
export type ShoppingItemStatus = 'PENDING' | 'PURCHASED';
export type WalletAccountType = 'CASH' | 'BANK' | 'CARD' | 'SAVINGS' | 'OTHER';
export type WalletCategoryType = 'INCOME' | 'EXPENSE';
export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'DEBT_PAYMENT';
export type BudgetPeriod = 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
export type DebtStatus = 'OPEN' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
export type SavingsGoalStatus = 'ACTIVE' | 'ACHIEVED' | 'ARCHIVED';

// Phase 2: Household Management
export type HomeAssetCategory = 'APPLIANCE' | 'ELECTRONICS' | 'FURNITURE' | 'POWER_TOOL' | 'OTHER';
export type RecurringExpenseCategory = 'UTILITY' | 'SUBSCRIPTION';
export type RecurringExpenseFrequency = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
export type MaintenanceFrequency = 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'CUSTOM';

// Phase 3: Business Management
export type BusinessType = 'PRINTING_3D' | 'GENERAL';
