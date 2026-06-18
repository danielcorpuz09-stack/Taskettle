import { defineStore } from 'pinia';
import { api } from '@/lib/api';
import type { RecurringExpense } from '@/types';

interface ExpensesState {
  expenses: RecurringExpense[];
  loading: boolean;
  filters: {
    category: string;
  };
}

export const useRecurringExpensesStore = defineStore('recurring-expenses', {
  state: (): ExpensesState => ({
    expenses: [],
    loading: false,
    filters: { category: '' },
  }),

  getters: {
    filteredExpenses: (state) => {
      if (!state.filters.category) return state.expenses;
      return state.expenses.filter((e) => e.category === state.filters.category);
    },

    totalMonthlyExpense: (state) => {
      return state.expenses.reduce((sum, e) => {
        if (e.frequency === 'MONTHLY') return sum + e.amountMinor;
        if (e.frequency === 'QUARTERLY') return sum + Math.round(e.amountMinor / 3);
        if (e.frequency === 'ANNUAL') return sum + Math.round(e.amountMinor / 12);
        return sum;
      }, 0);
    },

    overdue: (state) => {
      return state.expenses.filter(
        (e) => e.nextDue && new Date(e.nextDue) < new Date()
      );
    },

    dueSoon: (state) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return state.expenses.filter(
        (e) => e.nextDue && new Date(e.nextDue) <= tomorrow && new Date(e.nextDue) >= new Date()
      );
    },
  },

  actions: {
    async fetchExpenses(circleId: string) {
      this.loading = true;
      try {
        const { data } = await api.post<RecurringExpense[]>('/recurring-expenses/list', {
          circleId,
          ...(this.filters.category && { category: this.filters.category }),
        });
        this.expenses = Array.isArray(data) ? data : [];
      } finally {
        this.loading = false;
      }
    },

    async createExpense(circleId: string, payload: Partial<RecurringExpense>) {
      const { data } = await api.post<RecurringExpense>('/recurring-expenses', {
        circleId,
        ...payload,
      });
      this.expenses.unshift(data);
      return data;
    },

    async updateExpense(expenseId: string, payload: Partial<RecurringExpense>) {
      const { data } = await api.patch<RecurringExpense>(`/recurring-expenses/${expenseId}`, payload);
      const idx = this.expenses.findIndex((e) => e.id === expenseId);
      if (idx !== -1) this.expenses[idx] = data;
      return data;
    },

    async deleteExpense(expenseId: string) {
      await api.delete(`/recurring-expenses/${expenseId}`);
      this.expenses = this.expenses.filter((e) => e.id !== expenseId);
    },

    setFilter(key: string, value: string) {
      this.filters = { ...this.filters, [key]: value };
    },
  },
});
