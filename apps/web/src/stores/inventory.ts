import { defineStore } from 'pinia';
import { api } from '@/lib/api';
import type { InventoryItem, InventoryDashboard, ShoppingListItem } from '@/types';

interface InventoryState {
  items: InventoryItem[];
  shoppingList: ShoppingListItem[];
  dashboard: InventoryDashboard | null;
  loading: boolean;
  filters: {
    status: string;
    category: string;
    search: string;
  };
}

export const useInventoryStore = defineStore('inventory', {
  state: (): InventoryState => ({
    items: [],
    shoppingList: [],
    dashboard: null,
    loading: false,
    filters: { status: '', category: '', search: '' },
  }),

  getters: {
    lowStockItems: (state) => state.items.filter((i) => i.status === 'LOW_STOCK'),
    outOfStockItems: (state) => state.items.filter((i) => i.status === 'OUT_OF_STOCK'),
    pendingShoppingItems: (state) => state.shoppingList.filter((i) => i.status === 'PENDING'),
    purchasedShoppingItems: (state) => state.shoppingList.filter((i) => i.status === 'PURCHASED'),
  },

  actions: {
    async fetchItems(circleId: string) {
      this.loading = true;
      try {
        const params: Record<string, string> = {};
        if (this.filters.status) params.status = this.filters.status;
        if (this.filters.category) params.category = this.filters.category;
        if (this.filters.search) params.search = this.filters.search;

        const { data } = await api.get<{ items: InventoryItem[] }>(
          `/circles/${circleId}/inventory`,
          { params }
        );
        this.items = data.items;
      } finally {
        this.loading = false;
      }
    },

    async fetchDashboard(circleId: string) {
      const { data } = await api.get<{ dashboard: InventoryDashboard }>(
        `/circles/${circleId}/inventory/dashboard`
      );
      this.dashboard = data.dashboard;
    },

    async createItem(circleId: string, payload: Partial<InventoryItem>) {
      const { data } = await api.post<{ item: InventoryItem }>(
        `/circles/${circleId}/inventory`,
        payload
      );
      this.items.unshift(data.item);
      return data.item;
    },

    async updateItem(itemId: string, payload: Partial<InventoryItem>) {
      const { data } = await api.patch<{ item: InventoryItem }>(
        `/inventory/${itemId}`,
        payload
      );
      const idx = this.items.findIndex((i) => i.id === itemId);
      if (idx !== -1) this.items[idx] = data.item;
      return data.item;
    },

    async deleteItem(itemId: string) {
      await api.delete(`/inventory/${itemId}`);
      this.items = this.items.filter((i) => i.id !== itemId);
    },

    async addToShoppingList(itemId: string) {
      await api.post(`/inventory/${itemId}/add-to-shopping-list`);
    },

    async createTaskFromItem(itemId: string, assigneeId?: string | null) {
      const { data } = await api.post<{ taskId: string }>(
        `/inventory/${itemId}/create-task`,
        { assigneeId }
      );
      return data.taskId;
    },

    // Shopping list actions
    async fetchShoppingList(circleId: string) {
      const { data } = await api.get<{ items: ShoppingListItem[] }>(
        `/circles/${circleId}/shopping-list`
      );
      this.shoppingList = data.items;
    },

    async addShoppingItem(circleId: string, payload: { name: string; quantityNeeded?: number; unit?: string | null }) {
      const { data } = await api.post<{ item: ShoppingListItem }>(
        `/circles/${circleId}/shopping-list`,
        payload
      );
      this.shoppingList.unshift(data.item);
      return data.item;
    },

    async markPurchased(itemId: string) {
      const { data } = await api.patch<{ item: ShoppingListItem }>(
        `/shopping-list/${itemId}`,
        { status: 'PURCHASED' }
      );
      const idx = this.shoppingList.findIndex((i) => i.id === itemId);
      if (idx !== -1) this.shoppingList[idx] = data.item;
    },

    async markPending(itemId: string) {
      const { data } = await api.patch<{ item: ShoppingListItem }>(
        `/shopping-list/${itemId}`,
        { status: 'PENDING' }
      );
      const idx = this.shoppingList.findIndex((i) => i.id === itemId);
      if (idx !== -1) this.shoppingList[idx] = data.item;
    },

    async removeShoppingItem(itemId: string) {
      await api.delete(`/shopping-list/${itemId}`);
      this.shoppingList = this.shoppingList.filter((i) => i.id !== itemId);
    },
  },
});
