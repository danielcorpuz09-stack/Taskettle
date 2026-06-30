import { defineStore } from 'pinia';
import { api } from '@/lib/api';
import type {
  Budget,
  Debt,
  WalletAccount,
  WalletAnalytics,
  WalletCategory,
  WalletDashboard,
  WalletTransaction,
} from '@/types';

interface TransactionFilters {
  categoryId: string;
  type: string;
  search: string;
}

export type RangePreset = 'this-month' | 'last-month' | 'last-3-months' | 'this-year' | 'custom';

interface DateRange {
  preset: RangePreset;
  from: string;
  to: string;
}

interface WalletState {
  accounts: WalletAccount[];
  categories: WalletCategory[];
  transactions: WalletTransaction[];
  budgets: Budget[];
  debts: Debt[];
  dashboard: WalletDashboard | null;
  analytics: WalletAnalytics | null;
  loading: boolean;
  filters: TransactionFilters;
  selectedAccountId: string;
  dateRange: DateRange;
}

/** Computes ISO from/to bounds for a named period preset. */
function computeRange(preset: RangePreset): { from: string; to: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (preset) {
    case 'last-month':
      return { from: new Date(y, m - 1, 1).toISOString(), to: new Date(y, m, 1).toISOString() };
    case 'last-3-months':
      return { from: new Date(y, m - 2, 1).toISOString(), to: new Date(y, m + 1, 1).toISOString() };
    case 'this-year':
      return { from: new Date(y, 0, 1).toISOString(), to: new Date(y + 1, 0, 1).toISOString() };
    case 'this-month':
    default:
      return { from: new Date(y, m, 1).toISOString(), to: new Date(y, m + 1, 1).toISOString() };
  }
}

export const useWalletStore = defineStore('wallet', {
  state: (): WalletState => ({
    accounts: [],
    categories: [],
    transactions: [],
    budgets: [],
    debts: [],
    dashboard: null,
    analytics: null,
    loading: false,
    filters: { categoryId: '', type: '', search: '' },
    selectedAccountId: '',
    dateRange: { preset: 'last-3-months', ...computeRange('last-3-months') },
  }),

  getters: {
    activeAccounts: (state) => state.accounts.filter((a) => !a.archived),
    expenseCategories: (state) => state.categories.filter((c) => c.type === 'EXPENSE'),
    incomeCategories: (state) => state.categories.filter((c) => c.type === 'INCOME'),
    debtsOwedToMe: (state) => (userId: string) =>
      state.debts.filter((d) => d.lenderId === userId && d.remainingMinor > 0),
    debtsOwedByMe: (state) => (userId: string) =>
      state.debts.filter((d) => d.borrowerId === userId && d.remainingMinor > 0),
    selectedAccount: (state) =>
      state.accounts.find((a) => a.id === state.selectedAccountId) ?? null,
    rangeLabel: (state): string => {
      switch (state.dateRange.preset) {
        case 'this-month':
          return 'This month';
        case 'last-month':
          return 'Last month';
        case 'last-3-months':
          return 'Last 3 months';
        case 'this-year':
          return 'This year';
        default: {
          const from = new Date(state.dateRange.from).toLocaleDateString();
          const to = new Date(state.dateRange.to).toLocaleDateString();
          return `${from} – ${to}`;
        }
      }
    },
  },

  actions: {
    /** Shared account + date-range query params for scoped wallet endpoints. */
    rangeParams(): Record<string, string> {
      const params: Record<string, string> = {
        from: this.dateRange.from,
        to: this.dateRange.to,
      };
      if (this.selectedAccountId) params.accountId = this.selectedAccountId;
      return params;
    },

    setAccount(accountId: string) {
      this.selectedAccountId = accountId;
    },

    setRange(preset: RangePreset, from?: string, to?: string) {
      if (preset === 'custom' && from && to) {
        this.dateRange = { preset, from, to };
      } else {
        this.dateRange = { preset, ...computeRange(preset) };
      }
    },

    async fetchDashboard(circleId: string) {
      const { data } = await api.get<{ dashboard: WalletDashboard }>(
        `/circles/${circleId}/wallet/dashboard`,
        { params: this.rangeParams() }
      );
      this.dashboard = data.dashboard;
    },

    async fetchAnalytics(circleId: string) {
      const { data } = await api.get<{ analytics: WalletAnalytics }>(
        `/circles/${circleId}/wallet/analytics`,
        { params: this.rangeParams() }
      );
      this.analytics = data.analytics;
    },

    async fetchAccounts(circleId: string) {
      const { data } = await api.get<{ accounts: WalletAccount[] }>(
        `/circles/${circleId}/wallet/accounts`
      );
      this.accounts = data.accounts;
    },

    async createAccount(circleId: string, payload: Partial<WalletAccount>) {
      const { data } = await api.post<{ account: WalletAccount }>(
        `/circles/${circleId}/wallet/accounts`,
        payload
      );
      this.accounts.push(data.account);
      return data.account;
    },

    async updateAccount(accountId: string, payload: Record<string, unknown>) {
      const { data } = await api.patch<{ account: WalletAccount }>(
        `/wallet/accounts/${accountId}`,
        payload
      );
      const idx = this.accounts.findIndex((a) => a.id === accountId);
      if (idx !== -1) this.accounts[idx] = data.account;
      return data.account;
    },

    async deleteAccount(accountId: string) {
      await api.delete(`/wallet/accounts/${accountId}`);
      this.accounts = this.accounts.filter((a) => a.id !== accountId);
    },

    async fetchCategories(circleId: string) {
      const { data } = await api.get<{ categories: WalletCategory[] }>(
        `/circles/${circleId}/wallet/categories`
      );
      this.categories = data.categories;
    },

    async createCategory(circleId: string, payload: Partial<WalletCategory>) {
      const { data } = await api.post<{ category: WalletCategory }>(
        `/circles/${circleId}/wallet/categories`,
        payload
      );
      this.categories.push(data.category);
      return data.category;
    },

    async deleteCategory(categoryId: string) {
      await api.delete(`/wallet/categories/${categoryId}`);
      this.categories = this.categories.filter((c) => c.id !== categoryId);
    },

    async fetchTransactions(circleId: string) {
      this.loading = true;
      try {
        const params: Record<string, string> = { ...this.rangeParams() };
        if (this.filters.categoryId) params.categoryId = this.filters.categoryId;
        if (this.filters.type) params.type = this.filters.type;
        if (this.filters.search) params.search = this.filters.search;
        const { data } = await api.get<{ transactions: WalletTransaction[] }>(
          `/circles/${circleId}/wallet/transactions`,
          { params }
        );
        this.transactions = data.transactions;
      } finally {
        this.loading = false;
      }
    },

    async createTransaction(circleId: string, payload: Record<string, unknown>) {
      const { data } = await api.post<{ transaction: WalletTransaction }>(
        `/circles/${circleId}/wallet/transactions`,
        payload
      );
      this.transactions.unshift(data.transaction);
      return data.transaction;
    },

    async updateTransaction(transactionId: string, payload: Record<string, unknown>) {
      const { data } = await api.patch<{ transaction: WalletTransaction }>(
        `/wallet/transactions/${transactionId}`,
        payload
      );
      const idx = this.transactions.findIndex((t) => t.id === transactionId);
      if (idx !== -1) this.transactions[idx] = data.transaction;
      return data.transaction;
    },

    async deleteTransaction(transactionId: string) {
      await api.delete(`/wallet/transactions/${transactionId}`);
      this.transactions = this.transactions.filter((t) => t.id !== transactionId);
    },

    async fetchBudgets(circleId: string) {
      const params: Record<string, string> = {};
      if (this.selectedAccountId) params.accountId = this.selectedAccountId;
      const { data } = await api.get<{ budgets: Budget[] }>(
        `/circles/${circleId}/wallet/budgets`,
        { params }
      );
      this.budgets = data.budgets;
    },

    async createBudget(circleId: string, payload: Record<string, unknown>) {
      const { data } = await api.post<{ budget: Budget }>(
        `/circles/${circleId}/wallet/budgets`,
        payload
      );
      this.budgets.unshift(data.budget);
      return data.budget;
    },

    async updateBudget(budgetId: string, payload: Record<string, unknown>) {
      const { data } = await api.patch<{ budget: Budget }>(`/wallet/budgets/${budgetId}`, payload);
      const idx = this.budgets.findIndex((b) => b.id === budgetId);
      if (idx !== -1) this.budgets[idx] = data.budget;
      return data.budget;
    },

    async deleteBudget(budgetId: string) {
      await api.delete(`/wallet/budgets/${budgetId}`);
      this.budgets = this.budgets.filter((b) => b.id !== budgetId);
    },

    async fetchDebts(circleId: string) {
      const { data } = await api.get<{ debts: Debt[] }>(`/circles/${circleId}/wallet/debts`);
      this.debts = data.debts;
    },

    async createDebt(circleId: string, payload: Record<string, unknown>) {
      const { data } = await api.post<{ debt: Debt }>(
        `/circles/${circleId}/wallet/debts`,
        payload
      );
      this.debts.unshift(data.debt);
      return data.debt;
    },

    async updateDebt(debtId: string, payload: Record<string, unknown>) {
      const { data } = await api.patch<{ debt: Debt }>(`/wallet/debts/${debtId}`, payload);
      const idx = this.debts.findIndex((d) => d.id === debtId);
      if (idx !== -1) this.debts[idx] = data.debt;
      return data.debt;
    },

    async recordPayment(debtId: string, payload: Record<string, unknown>) {
      const { data } = await api.post<{ debt: Debt }>(
        `/wallet/debts/${debtId}/payments`,
        payload
      );
      const idx = this.debts.findIndex((d) => d.id === debtId);
      if (idx !== -1) this.debts[idx] = data.debt;
      return data.debt;
    },

    reset() {
      this.accounts = [];
      this.categories = [];
      this.transactions = [];
      this.budgets = [];
      this.debts = [];
      this.dashboard = null;
      this.analytics = null;
      this.filters = { categoryId: '', type: '', search: '' };
      this.selectedAccountId = '';
      this.dateRange = { preset: 'last-3-months', ...computeRange('last-3-months') };
    },
  },
});
