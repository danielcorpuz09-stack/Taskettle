import { defineStore } from 'pinia';
import { api } from '@/lib/api';
import type {
  Business,
  BusinessDashboard,
  CalculationInput,
  CostBreakdown,
  Product,
  WalletTransaction,
} from '@/types';

interface BusinessState {
  businesses: Business[];
  current: Business | null;
  dashboard: BusinessDashboard | null;
  transactions: WalletTransaction[];
  products: Product[];
  loading: boolean;
}

export const useBusinessStore = defineStore('business', {
  state: (): BusinessState => ({
    businesses: [],
    current: null,
    dashboard: null,
    transactions: [],
    products: [],
    loading: false,
  }),

  getters: {
    activeBusinesses: (state) => state.businesses.filter((b) => !b.archived),
  },

  actions: {
    async fetchBusinesses(circleId: string) {
      const { data } = await api.get<{ businesses: Business[] }>(`/circles/${circleId}/business`);
      this.businesses = data.businesses;
    },

    async createBusiness(circleId: string, payload: Record<string, unknown>) {
      const { data } = await api.post<{ business: Business }>(
        `/circles/${circleId}/business`,
        payload
      );
      this.businesses.push(data.business);
      return data.business;
    },

    async fetchBusiness(businessId: string) {
      const { data } = await api.get<{ business: Business }>(`/business/${businessId}`);
      this.current = data.business;
      return data.business;
    },

    async updateBusiness(businessId: string, payload: Record<string, unknown>) {
      const { data } = await api.patch<{ business: Business }>(`/business/${businessId}`, payload);
      const idx = this.businesses.findIndex((b) => b.id === businessId);
      if (idx !== -1) this.businesses[idx] = data.business;
      if (this.current?.id === businessId) this.current = data.business;
      return data.business;
    },

    async deleteBusiness(businessId: string) {
      await api.delete(`/business/${businessId}`);
      this.businesses = this.businesses.filter((b) => b.id !== businessId);
      if (this.current?.id === businessId) this.current = null;
    },

    async fetchDashboard(businessId: string) {
      const { data } = await api.get<{ dashboard: BusinessDashboard }>(
        `/business/${businessId}/dashboard`
      );
      this.dashboard = data.dashboard;
    },

    async fetchTransactions(businessId: string) {
      this.loading = true;
      try {
        const { data } = await api.get<{ transactions: WalletTransaction[] }>(
          `/business/${businessId}/transactions`
        );
        this.transactions = data.transactions;
      } finally {
        this.loading = false;
      }
    },

    async recordSale(businessId: string, payload: Record<string, unknown>) {
      const { data } = await api.post<{ transaction: WalletTransaction }>(
        `/business/${businessId}/sales`,
        payload
      );
      return data.transaction;
    },

    async recordExpense(businessId: string, payload: Record<string, unknown>) {
      const { data } = await api.post<{ transaction: WalletTransaction }>(
        `/business/${businessId}/expenses`,
        payload
      );
      return data.transaction;
    },

    async calculate(businessId: string, payload: CalculationInput) {
      const { data } = await api.post<{ breakdown: CostBreakdown }>(
        `/business/${businessId}/calculate`,
        payload
      );
      return data.breakdown;
    },

    async fetchProducts(businessId: string) {
      const { data } = await api.get<{ products: Product[] }>(`/business/${businessId}/products`);
      this.products = data.products;
    },

    async createProduct(businessId: string, payload: Record<string, unknown>) {
      const { data } = await api.post<{ product: Product }>(
        `/business/${businessId}/products`,
        payload
      );
      this.products.unshift(data.product);
      return data.product;
    },

    async deleteProduct(businessId: string, productId: string) {
      await api.delete(`/business/${businessId}/products/${productId}`);
      this.products = this.products.filter((p) => p.id !== productId);
    },

    reset() {
      this.businesses = [];
      this.current = null;
      this.dashboard = null;
      this.transactions = [];
      this.products = [];
      this.loading = false;
    },
  },
});
