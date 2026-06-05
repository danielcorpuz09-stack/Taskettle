import { defineStore } from 'pinia';
import { api, getStoredToken, setStoredToken } from '@/lib/api';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: getStoredToken(),
    loading: false,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token),
  },
  actions: {
    setSession(user: User, token: string) {
      this.user = user;
      this.token = token;
      setStoredToken(token);
    },

    async register(payload: { name: string; email: string; password: string }) {
      const { data } = await api.post<{ user: User; accessToken: string }>('/auth/register', payload);
      this.setSession(data.user, data.accessToken);
    },

    async login(payload: { email: string; password: string }) {
      const { data } = await api.post<{ user: User; accessToken: string }>('/auth/login', payload);
      this.setSession(data.user, data.accessToken);
    },

    async fetchMe() {
      if (!this.token) return;
      this.loading = true;
      try {
        const { data } = await api.get<{ user: User }>('/auth/me');
        this.user = data.user;
      } finally {
        this.loading = false;
      }
    },

    logout() {
      this.user = null;
      this.token = null;
      setStoredToken(null);
    },
  },
});
