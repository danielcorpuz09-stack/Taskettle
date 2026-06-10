import { defineStore } from 'pinia';
import { api } from '@/lib/api';
import type { Notification } from '@/types';

const POLL_MS = 60_000;

interface NotificationState {
  items: Notification[];
  unread: number;
  pollTimer: number | null;
}

export const useNotificationStore = defineStore('notifications', {
  state: (): NotificationState => ({
    items: [],
    unread: 0,
    pollTimer: null,
  }),
  actions: {
    async fetch() {
      const { data } = await api.get<{ notifications: Notification[]; unread: number }>(
        '/notifications'
      );
      this.items = data.notifications;
      this.unread = data.unread;
    },

    async markRead(id: string) {
      const { data } = await api.patch<{ notification: Notification }>(`/notifications/${id}/read`);
      const item = this.items.find((n) => n.id === id);
      if (item && !item.read) {
        item.read = true;
        this.unread = Math.max(0, this.unread - 1);
      }
      return data.notification;
    },

    async markAllRead() {
      await api.post('/notifications/read-all');
      this.items.forEach((n) => (n.read = true));
      this.unread = 0;
    },

    startPolling() {
      if (this.pollTimer !== null) return;
      void this.fetch();
      this.pollTimer = window.setInterval(() => void this.fetch(), POLL_MS);
    },

    stopPolling() {
      if (this.pollTimer !== null) {
        window.clearInterval(this.pollTimer);
        this.pollTimer = null;
      }
    },

    reset() {
      this.stopPolling();
      this.items = [];
      this.unread = 0;
    },
  },
});
