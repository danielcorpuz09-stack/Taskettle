import { defineStore } from 'pinia';
import { api } from '@/lib/api';
import type { HomeAsset } from '@/types';

interface AssetsState {
  assets: HomeAsset[];
  loading: boolean;
  filters: {
    category: string;
  };
}

export const useAssetsStore = defineStore('assets', {
  state: (): AssetsState => ({
    assets: [],
    loading: false,
    filters: { category: '' },
  }),

  getters: {
    filteredAssets: (state) => {
      if (!state.filters.category) return state.assets;
      return state.assets.filter((a) => a.category === state.filters.category);
    },

    expiringSoonAssets: (state) => {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return state.assets.filter(
        (a) =>
          a.warrantyExpiration &&
          new Date(a.warrantyExpiration) <= thirtyDaysFromNow &&
          new Date(a.warrantyExpiration) > new Date()
      );
    },

    expiredAssets: (state) => {
      return state.assets.filter(
        (a) => a.warrantyExpiration && new Date(a.warrantyExpiration) < new Date()
      );
    },
  },

  actions: {
    async fetchAssets(circleId: string) {
      this.loading = true;
      try {
        const { data } = await api.post<HomeAsset[]>('/assets/list', {
          circleId,
          ...(this.filters.category && { category: this.filters.category }),
        });
        this.assets = Array.isArray(data) ? data : [];
      } finally {
        this.loading = false;
      }
    },

    async createAsset(circleId: string, payload: Partial<HomeAsset>) {
      const { data } = await api.post<HomeAsset>('/assets', {
        circleId,
        ...payload,
      });
      this.assets.unshift(data);
      return data;
    },

    async updateAsset(assetId: string, payload: Partial<HomeAsset>) {
      const { data } = await api.patch<HomeAsset>(`/assets/${assetId}`, payload);
      const idx = this.assets.findIndex((a) => a.id === assetId);
      if (idx !== -1) this.assets[idx] = data;
      return data;
    },

    async deleteAsset(assetId: string) {
      await api.delete(`/assets/${assetId}`);
      this.assets = this.assets.filter((a) => a.id !== assetId);
    },

    setFilter(key: string, value: string) {
      this.filters = { ...this.filters, [key]: value };
    },
  },
});
