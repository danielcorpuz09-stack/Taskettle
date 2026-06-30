export type Role = 'OWNER' | 'MEMBER';
export type TaskStatus = 'BACKLOG' | 'TODO' | 'DOING' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskRecurrence = 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type NotificationType = 'DUE_SOON' | 'OVERDUE' | 'DEBT_DUE_SOON' | 'DEBT_OVERDUE';
export type InventoryStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
export type ShoppingItemStatus = 'PENDING' | 'PURCHASED';
export type WalletAccountType = 'CASH' | 'BANK' | 'CARD' | 'SAVINGS' | 'OTHER';
export type WalletCategoryType = 'INCOME' | 'EXPENSE';
export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'DEBT_PAYMENT';
export type BudgetPeriod = 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
export type DebtStatus = 'OPEN' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';

// Phase 2: Household Management
export type HomeAssetCategory = 'APPLIANCE' | 'ELECTRONICS' | 'FURNITURE' | 'POWER_TOOL' | 'OTHER';
export type RecurringExpenseCategory = 'UTILITY' | 'SUBSCRIPTION';
export type RecurringExpenseFrequency = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
export type MaintenanceFrequency = 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'CUSTOM';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
}

export interface CircleSummary {
  id: string;
  name: string;
  icon: string;
  role: Role;
  memberCount: number;
}

export interface Member {
  userId: string;
  name: string;
  email: string;
  avatarColor: string;
  role: Role;
}

export interface TaskAssignee {
  userId: string;
  name: string;
  avatarColor: string;
}

export interface Task {
  id: string;
  circleId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  category: string | null;
  assignee: TaskAssignee | null;
  dueDate: string | null;
  endAt: string | null;
  allDay: boolean;
  recurrence: TaskRecurrence | null;
  recurrenceUntil: string | null;
  position: number;
  createdById: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  businessRecord?: { id: string; title: string; recordType: string };
}

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  taskId: string | null;
  read: boolean;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  circleId: string;
  name: string;
  description: string | null;
  category: string | null;
  quantity: number;
  unit: string | null;
  minimumThreshold: number;
  location: string | null;
  notes: string | null;
  status: InventoryStatus;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingListItem {
  id: string;
  circleId: string;
  inventoryItemId: string | null;
  name: string;
  quantityNeeded: number;
  unit: string | null;
  status: ShoppingItemStatus;
  addedById: string;
  purchasedById: string | null;
  purchasedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryDashboard {
  totalCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  recentlyUpdated: InventoryItem[];
}

export interface WalletAccount {
  id: string;
  circleId: string;
  name: string;
  type: WalletAccountType;
  currency: string;
  ownerId: string | null;
  balanceMinor: number;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WalletCategory {
  id: string;
  circleId: string;
  name: string;
  type: WalletCategoryType;
  color: string;
  icon: string;
  createdAt: string;
}

export interface WalletTransaction {
  id: string;
  circleId: string;
  accountId: string;
  type: TransactionType;
  amountMinor: number;
  currency: string;
  categoryId: string | null;
  note: string | null;
  payee: string | null;
  transactionDate: string;
  createdById: string;
  debtId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  circleId: string;
  name: string;
  categoryId: string | null;
  amountMinor: number;
  currency: string;
  period: BudgetPeriod;
  startsAt: string;
  endsAt: string | null;
  spentMinor: number;
  remainingMinor: number;
  createdById: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DebtPayment {
  id: string;
  debtId: string;
  amountMinor: number;
  currency: string;
  paidById: string;
  paidToId: string;
  paidAt: string;
  createdAt: string;
}

export interface Debt {
  id: string;
  circleId: string;
  lenderId: string;
  borrowerId: string;
  amountMinor: number;
  paidMinor: number;
  remainingMinor: number;
  currency: string;
  reason: string | null;
  dueDate: string | null;
  status: DebtStatus;
  createdById: string;
  paidAt: string | null;
  payments: DebtPayment[];
  createdAt: string;
  updatedAt: string;
}

export interface WalletDashboard {
  currency: string;
  incomeMinor: number;
  expenseMinor: number;
  netMinor: number;
  accountsBalanceMinor: number;
  owedToMeMinor: number;
  owedByMeMinor: number;
  openDebtCount: number;
  overdueDebtCount: number;
}

// Phase 2: Household Management Interfaces

export interface HomeAsset {
  id: string;
  circleId: string;
  name: string;
  category: HomeAssetCategory;
  purchaseDate: string | null;
  warrantyExpiration: string | null;
  serialNumber: string | null;
  receiptPhotoUrls: string[] | null;
  currentValue: number | null;
  notes: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringExpense {
  id: string;
  circleId: string;
  name: string;
  category: RecurringExpenseCategory;
  amountMinor: number;
  currency: string;
  dueDate: number | null;
  frequency: RecurringExpenseFrequency;
  autoPay: boolean;
  notes: string | null;
  lastOccurred: string | null;
  nextDue: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  circleId: string;
  name: string;
  model: string | null;
  plateNumber: string | null;
  registrationExpiry: string | null;
  insuranceExpiry: string | null;
  notes: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceSchedule {
  id: string;
  circleId: string;
  title: string;
  description: string | null;
  frequency: MaintenanceFrequency;
  nextDueDate: string;
  assigneeId: string | null;
  lastTaskId: string | null;
  notes: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

// Phase 3: Business Management
export type BusinessFieldType = 'TEXT' | 'NUMBER' | 'CURRENCY' | 'DATE' | 'SELECT' | 'BOOLEAN' | 'URL';
export type BusinessRecordType = 'INCOME' | 'EXPENSE' | 'ORDER' | 'SERVICE' | 'RENTAL_PERIOD' | 'OTHER';

export interface Business {
  id: string;
  circleId: string;
  name: string;
  businessType: string;
  description: string | null;
  currency: string;
  archivedAt: string | null;
  createdById: string;
  createdAt: string;
}

export interface BusinessFieldDef {
  id: string;
  businessId: string;
  name: string;
  key: string;
  fieldType: BusinessFieldType;
  options: string[] | null;
  unit: string | null;
  isRequired: boolean;
  showInAnalytics: boolean;
  position: number;
  createdAt: string;
}

export interface BusinessFieldValue {
  fieldDefId: string;
  key: string;
  fieldType: BusinessFieldType;
  value: string;
}

export interface BusinessRecord {
  id: string;
  businessId: string;
  recordType: BusinessRecordType;
  title: string;
  amountMinor: number | null;
  currency: string | null;
  note: string | null;
  recordDate: string;
  walletTransactionId: string | null;
  taskId: string | null;
  createdById: string;
  createdAt: string;
  fieldValues: BusinessFieldValue[];
}

export interface BusinessAnalyticsSummary {
  totalIncomeMinor: number;
  totalExpenseMinor: number;
  profitMinor: number;
  currency: string;
}

export interface BusinessAnalyticsTimeSeries {
  period: string;
  incomeMinor: number;
  expenseMinor: number;
}

export interface BusinessAnalytics {
  summary: BusinessAnalyticsSummary;
  timeSeries: BusinessAnalyticsTimeSeries[];
  byRecordType: Record<string, number>;
  byFieldValue?: Record<string, number>;
}
