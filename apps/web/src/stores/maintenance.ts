import { defineStore } from 'pinia';
import { api } from '@/lib/api';
import type { MaintenanceSchedule } from '@/types';

interface MaintenanceState {
  schedules: MaintenanceSchedule[];
  loading: boolean;
}

export const useMaintenanceStore = defineStore('maintenance', {
  state: (): MaintenanceState => ({
    schedules: [],
    loading: false,
  }),

  getters: {
    upcomingSchedules: (state) => {
      return state.schedules
        .filter((s) => new Date(s.nextDueDate) >= new Date())
        .sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());
    },

    overdue: (state) => {
      return state.schedules.filter((s) => new Date(s.nextDueDate) < new Date());
    },

    dueSoon: (state) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 7);
      return state.schedules.filter(
        (s) =>
          new Date(s.nextDueDate) >= new Date() &&
          new Date(s.nextDueDate) <= tomorrow
      );
    },
  },

  actions: {
    async fetchSchedules(circleId: string) {
      this.loading = true;
      try {
        const { data } = await api.post<MaintenanceSchedule[]>('/maintenance/list', {
          circleId,
        });
        this.schedules = Array.isArray(data) ? data : [];
      } finally {
        this.loading = false;
      }
    },

    async createSchedule(circleId: string, payload: Partial<MaintenanceSchedule>) {
      const { data } = await api.post<MaintenanceSchedule>('/maintenance', {
        circleId,
        ...payload,
      });
      this.schedules.unshift(data);
      return data;
    },

    async updateSchedule(scheduleId: string, payload: Partial<MaintenanceSchedule>) {
      const { data } = await api.patch<MaintenanceSchedule>(`/maintenance/${scheduleId}`, payload);
      const idx = this.schedules.findIndex((s) => s.id === scheduleId);
      if (idx !== -1) this.schedules[idx] = data;
      return data;
    },

    async deleteSchedule(scheduleId: string) {
      await api.delete(`/maintenance/${scheduleId}`);
      this.schedules = this.schedules.filter((s) => s.id !== scheduleId);
    },
  },
});
