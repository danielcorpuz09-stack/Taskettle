import { defineStore } from 'pinia';
import { api } from '@/lib/api';
import type { CircleSummary, Member, Task, TaskStatus } from '@/types';

interface BoardState {
  circles: CircleSummary[];
  currentCircleId: string | null;
  members: Member[];
  tasks: Task[];
  loading: boolean;
}

const COLUMN_ORDER: TaskStatus[] = ['BACKLOG', 'TODO', 'DOING', 'DONE'];

export const useBoardStore = defineStore('board', {
  state: (): BoardState => ({
    circles: [],
    currentCircleId: null,
    members: [],
    tasks: [],
    loading: false,
  }),
  getters: {
    currentCircle: (state) => state.circles.find((c) => c.id === state.currentCircleId) ?? null,
    tasksByStatus: (state) => {
      const grouped: Record<TaskStatus, Task[]> = { BACKLOG: [], TODO: [], DOING: [], DONE: [] };
      for (const task of state.tasks) grouped[task.status].push(task);
      for (const status of COLUMN_ORDER) {
        grouped[status].sort((a, b) => a.position - b.position);
      }
      return grouped;
    },
    isCircleOwner: (state) => {
      const circle = state.circles.find((c) => c.id === state.currentCircleId);
      return circle?.role === 'OWNER';
    },
  },
  actions: {
    async fetchCircles() {
      const { data } = await api.get<{ circles: CircleSummary[] }>('/circles');
      this.circles = data.circles;
      if (!this.currentCircleId && data.circles.length > 0) {
        this.currentCircleId = data.circles[0].id;
      }
    },

    async createCircle(payload: { name: string; icon?: string }) {
      const { data } = await api.post<{ circle: CircleSummary }>('/circles', payload);
      this.circles.push(data.circle);
      this.currentCircleId = data.circle.id;
      await this.loadBoard();
      return data.circle;
    },

    async selectCircle(circleId: string) {
      this.currentCircleId = circleId;
      await this.loadBoard();
    },

    async loadBoard() {
      if (!this.currentCircleId) return;
      this.loading = true;
      try {
        const [membersRes, tasksRes] = await Promise.all([
          api.get<{ members: Member[] }>(`/circles/${this.currentCircleId}/members`),
          api.get<{ tasks: Task[] }>(`/circles/${this.currentCircleId}/tasks`),
        ]);
        this.members = membersRes.data.members;
        this.tasks = tasksRes.data.tasks;
      } finally {
        this.loading = false;
      }
    },

    async createTask(payload: {
      title: string;
      description?: string;
      assigneeId?: string | null;
      dueDate?: string | null;
      status?: string;
      priority?: string;
      category?: string | null;
    }) {
      if (!this.currentCircleId) return;
      const { data } = await api.post<{ task: Task }>(
        `/circles/${this.currentCircleId}/tasks`,
        payload
      );
      this.tasks.push(data.task);
    },

    async updateTask(taskId: string, patch: Partial<Task> & { assigneeId?: string | null }) {
      const { data } = await api.patch<{ task: Task }>(`/tasks/${taskId}`, patch);
      this.replaceTask(data.task);
      return data.task;
    },

    async deleteTask(taskId: string) {
      const snapshot = this.tasks;
      this.tasks = this.tasks.filter((t) => t.id !== taskId);
      try {
        await api.delete(`/tasks/${taskId}`);
      } catch (err) {
        this.tasks = snapshot; // rollback
        throw err;
      }
    },

    /** Optimistically move a task to a new column/position, reconcile with server. */
    async moveTask(taskId: string, status: TaskStatus, position: number) {
      const task = this.tasks.find((t) => t.id === taskId);
      if (!task) return;
      const prev = { status: task.status, position: task.position };
      task.status = status;
      task.position = position;
      if (status === 'DONE') task.completedAt = new Date().toISOString();
      else task.completedAt = null;

      try {
        const { data } = await api.patch<{ task: Task }>(`/tasks/${taskId}`, { status, position });
        this.replaceTask(data.task);
      } catch (err) {
        task.status = prev.status;
        task.position = prev.position;
        throw err;
      }
    },

    replaceTask(task: Task) {
      const idx = this.tasks.findIndex((t) => t.id === task.id);
      if (idx >= 0) this.tasks[idx] = task;
      else this.tasks.push(task);
    },

    async updateCircle(circleId: string, payload: { name?: string; icon?: string }) {
      const { data } = await api.patch<{ circle: CircleSummary }>(`/circles/${circleId}`, payload);
      const idx = this.circles.findIndex((c) => c.id === circleId);
      if (idx >= 0) {
        this.circles[idx] = data.circle;
      }
      return data.circle;
    },

    async archiveCircle(circleId: string) {
      await api.delete(`/circles/${circleId}`);
      this.circles = this.circles.filter((c) => c.id !== circleId);
      if (this.currentCircleId === circleId) {
        this.currentCircleId = this.circles.length > 0 ? this.circles[0].id : null;
        if (this.currentCircleId) {
          await this.loadBoard();
        }
      }
    },

    async removeMember(circleId: string, userId: string) {
      await api.delete(`/circles/${circleId}/members/${userId}`);
      this.members = this.members.filter((m) => m.userId !== userId);
    },

    async leaveCircle(circleId: string) {
      await api.delete(`/circles/${circleId}/leave`);
      this.circles = this.circles.filter((c) => c.id !== circleId);
      if (this.currentCircleId === circleId) {
        this.currentCircleId = this.circles.length > 0 ? this.circles[0].id : null;
        if (this.currentCircleId) {
          await this.loadBoard();
        }
      }
    },

    reset() {
      this.circles = [];
      this.currentCircleId = null;
      this.members = [];
      this.tasks = [];
    },
  },
});
