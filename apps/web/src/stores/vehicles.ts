import { defineStore } from 'pinia';
import { api } from '@/lib/api';
import type { Vehicle } from '@/types';

interface VehiclesState {
  vehicles: Vehicle[];
  loading: boolean;
}

export const useVehiclesStore = defineStore('vehicles', {
  state: (): VehiclesState => ({
    vehicles: [],
    loading: false,
  }),

  getters: {
    registrationExpiring: (state) => {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return state.vehicles.filter(
        (v) =>
          v.registrationExpiry &&
          new Date(v.registrationExpiry) <= thirtyDaysFromNow &&
          new Date(v.registrationExpiry) > new Date()
      );
    },

    insuranceExpiring: (state) => {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return state.vehicles.filter(
        (v) =>
          v.insuranceExpiry &&
          new Date(v.insuranceExpiry) <= thirtyDaysFromNow &&
          new Date(v.insuranceExpiry) > new Date()
      );
    },

    overdue: (state) => {
      return state.vehicles.filter(
        (v) =>
          (v.registrationExpiry && new Date(v.registrationExpiry) < new Date()) ||
          (v.insuranceExpiry && new Date(v.insuranceExpiry) < new Date())
      );
    },
  },

  actions: {
    async fetchVehicles(circleId: string) {
      this.loading = true;
      try {
        const { data } = await api.post<Vehicle[]>('/vehicles/list', {
          circleId,
        });
        this.vehicles = Array.isArray(data) ? data : [];
      } finally {
        this.loading = false;
      }
    },

    async createVehicle(circleId: string, payload: Partial<Vehicle>) {
      const { data } = await api.post<Vehicle>('/vehicles', {
        circleId,
        ...payload,
      });
      this.vehicles.unshift(data);
      return data;
    },

    async updateVehicle(vehicleId: string, payload: Partial<Vehicle>) {
      const { data } = await api.patch<Vehicle>(`/vehicles/${vehicleId}`, payload);
      const idx = this.vehicles.findIndex((v) => v.id === vehicleId);
      if (idx !== -1) this.vehicles[idx] = data;
      return data;
    },

    async deleteVehicle(vehicleId: string) {
      await api.delete(`/vehicles/${vehicleId}`);
      this.vehicles = this.vehicles.filter((v) => v.id !== vehicleId);
    },
  },
});
