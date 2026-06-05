import { defineStore } from 'pinia';
import { api } from '@/lib/api';
import type {
  Budget,
  Debt,
  WalletAccount,
  WalletCategory,
  WalletDashboard,
  WalletTransaction,
} from '@/types';

interface TransactionFilters {
  accountId: string;
  categoryId: string;
  type: string;
  search: string;
}

interface WalletState {
  accounts: WalletAccount[];
  categories: WalletCategory[];
  transactions: WalletTransaction[];
  budgets: Budget[];
  debts: Debt[];
  dashboard: WalletDashboard | null;
  loading: boolean;
  filters: TransactionFilters;
}

export const useWalletStore = defineStore('wallet', {
  state: (): WalletState => ({
    accounts: [],
    categories: [],
    transactions: [],
    budgets: [],
    debts: [],
    dashboard: null,
    loading: false,
    filters: { accountId: '', categoryId: '', type: '', search: '' },
  }),

  getters: {
    activeAccounts: (state) => state.accounts.filter((a) => !a.archived),
    expenseCategories: (state) => state.categories.filter((c) => c.type === 'EXPENSE'),
    incomeCategories: (state) => state.categories.filter((c) => c.type === 'INCOME'),
    debtsOwedToMe: (state) => (userId: string) =>
      state.debts.filter((d) => d.lenderId === userId && d.remainingMinor > 0),
    debtsOwedByMe: (state) => (userId: string) =>
      state.debts.filter((d) => d.borrowerId === userId && d.remainingMinor > 0),
  },

  actions: {
    async fetchDashboard(circleId: string) {
      const { data } = await api.get<{ dashboard: WalletDashboard }>(
        `/circles/${circleId}/wallet/dashboard`
      );
      this.dashboard = data.dashboard;
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
        const params: Record<string, string> = {};
        if (this.filters.accountId) params.accountId = this.filters.accountId;
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
      const { data } = await api.get<{ budgets: Budget[] }>(
        `/circles/${circleId}/wallet/budgets`
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
      this.filters = { accountId: '', categoryId: '', type: '', search: '' };
    },
  },
});
