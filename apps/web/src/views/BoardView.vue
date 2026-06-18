<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import BoardColumn from '@/components/BoardColumn.vue';
import CreateTaskModal from '@/components/CreateTaskModal.vue';
import TaskDetailModal from '@/components/TaskDetailModal.vue';
import InviteMemberModal from '@/components/InviteMemberModal.vue';
import CircleSettingsModal from '@/components/CircleSettingsModal.vue';
import NotificationBell from '@/components/NotificationBell.vue';
import { useAuthStore } from '@/stores/auth';
import { useBoardStore } from '@/stores/board';
import { useNotificationStore } from '@/stores/notifications';
import { api, apiErrorMessage } from '@/lib/api';
import type { Task, TaskStatus } from '@/types';

const router = useRouter();
const auth = useAuthStore();
const board = useBoardStore();
const notifications = useNotificationStore();

const showCreate = ref(false);
const showInvite = ref(false);
const showSettings = ref(false);
const showNewCircle = ref(false);
const showAvatarMenu = ref(false);
const showSidebar = ref(false);
const showMemberList = ref(false);
const selectedTask = ref<Task | null>(null);
const newCircleName = ref('');
const error = ref('');
const removingMemberId = ref<string | null>(null);
const confirmingLeave = ref(false);

// Tabs
type TabId = 'boards' | 'schedule';
const activeTab = ref<TabId>('boards');

// Search & filter
const searchQuery = ref('');
const filterAssignee = ref<string | ''>('');

// Schedule state
const today = new Date();
const currentMonth = ref(today.getMonth());
const currentYear = ref(today.getFullYear());
const includedCircleIds = ref<string[]>([]);
const otherCircleTasks = ref<Task[]>([]);
const loadingOtherTasks = ref(false);

const columns: { status: TaskStatus; title: string; accent: string }[] = [
  { status: 'TODO', title: 'To Do', accent: '#8fa998' },
  { status: 'DOING', title: 'Doing', accent: '#aa9eb5' },
  { status: 'DONE', title: 'Done', accent: '#4c6455' },
];

const grouped = computed(() => {
  const all = board.tasksByStatus;
  const q = searchQuery.value.toLowerCase().trim();
  const assignee = filterAssignee.value;

  if (!q && !assignee) return all;

  const result: Record<TaskStatus, Task[]> = { TODO: [], DOING: [], DONE: [] };
  for (const status of ['TODO', 'DOING', 'DONE'] as TaskStatus[]) {
    result[status] = all[status].filter((task) => {
      if (q && !task.title.toLowerCase().includes(q) && !(task.description?.toLowerCase().includes(q))) return false;
      if (assignee && task.assignee?.userId !== assignee) return false;
      return true;
    });
  }
  return result;
});
const hasCircle = computed(() => Boolean(board.currentCircleId));
const hasActiveFilters = computed(() => Boolean(searchQuery.value || filterAssignee.value));

// Schedule computed
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const displayMonth = computed(() => `${monthNames[currentMonth.value]} ${currentYear.value}`);

const otherCircles = computed(() => board.circles.filter((c) => c.id !== board.currentCircleId));

const allScheduleTasks = computed(() => {
  const base = [...board.tasks];
  if (includedCircleIds.value.length > 0) {
    base.push(...otherCircleTasks.value);
  }
  return base;
});

interface CalendarDay {
  date: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: Task[];
}

const calendarDays = computed((): CalendarDay[] => {
  const year = currentYear.value;
  const month = currentMonth.value;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const days: CalendarDay[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    days.push({ date: d, month: m, year: y, isCurrentMonth: false, isToday: false, tasks: [] });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    days.push({ date: d, month, year, isCurrentMonth: true, isToday, tasks: [] });
  }

  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    const m = month === 11 ? 0 : month + 1;
    const y = month === 11 ? year + 1 : year;
    days.push({ date: d, month: m, year: y, isCurrentMonth: false, isToday: false, tasks: [] });
  }

  for (const task of allScheduleTasks.value) {
    if (!task.dueDate) continue;
    const due = new Date(task.dueDate);
    const match = days.find((d) => d.date === due.getDate() && d.month === due.getMonth() && d.year === due.getFullYear());
    if (match) match.tasks.push(task);
  }

  return days;
});

const completedThisWeek = computed(() => {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const total = board.tasks.length;
  if (total === 0) return 0;
  const done = board.tasks.filter((t) => t.status === 'DONE' && t.completedAt && new Date(t.completedAt) >= weekStart).length;
  return Math.round((done / total) * 100);
});

const upcomingCount = computed(() => {
  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(now.getDate() + (6 - now.getDay()));
  weekEnd.setHours(23, 59, 59, 999);
  return allScheduleTasks.value.filter((t) => {
    if (!t.dueDate || t.status === 'DONE') return false;
    const due = new Date(t.dueDate);
    return due >= now && due <= weekEnd;
  }).length;
});

function taskColor(task: Task): string {
  if (task.status === 'DONE') return '#b2cdbb';
  if (task.dueDate && new Date(task.dueDate) < new Date()) return '#fdcbcb';
  return '#cee9d6';
}

function prevMonth() {
  if (currentMonth.value === 0) { currentMonth.value = 11; currentYear.value--; }
  else currentMonth.value--;
}
function nextMonth() {
  if (currentMonth.value === 11) { currentMonth.value = 0; currentYear.value++; }
  else currentMonth.value++;
}
function goToday() {
  currentMonth.value = today.getMonth();
  currentYear.value = today.getFullYear();
}

async function toggleCircleInclusion(circleId: string) {
  const idx = includedCircleIds.value.indexOf(circleId);
  if (idx >= 0) {
    includedCircleIds.value.splice(idx, 1);
    otherCircleTasks.value = otherCircleTasks.value.filter((t) => t.circleId !== circleId);
  } else {
    includedCircleIds.value.push(circleId);
    loadingOtherTasks.value = true;
    try {
      const { data } = await api.get<{ tasks: Task[] }>(`/circles/${circleId}/tasks`);
      otherCircleTasks.value.push(...data.tasks);
    } catch (err) {
      error.value = apiErrorMessage(err);
      includedCircleIds.value.splice(includedCircleIds.value.indexOf(circleId), 1);
    } finally {
      loadingOtherTasks.value = false;
    }
  }
}

onMounted(async () => {
  try {
    await Promise.all([auth.fetchMe(), board.fetchCircles()]);
    if (board.currentCircleId) await board.loadBoard();
    notifications.startPolling();
  } catch (err) {
    error.value = apiErrorMessage(err);
  }
});

onUnmounted(() => notifications.stopPolling());

function openTask(task: Task) {
  selectedTask.value = task;
}

async function onDrop(payload: { taskId: string; status: TaskStatus; newIndex: number }) {
  const list = grouped.value[payload.status];
  // Compute a midpoint position between neighbours at the drop index.
  const before = list[payload.newIndex - 1]?.position;
  const after = list[payload.newIndex + 1]?.position;
  let position: number;
  if (before == null && after == null) position = 1024;
  else if (before == null) position = (after as number) / 2;
  else if (after == null) position = before + 1024;
  else position = (before + after) / 2;

  try {
    await board.moveTask(payload.taskId, payload.status, position);
  } catch (err) {
    error.value = apiErrorMessage(err, 'Could not move task');
  }
}

async function createCircle() {
  if (!newCircleName.value.trim()) return;
  try {
    await board.createCircle({ name: newCircleName.value.trim() });
    newCircleName.value = '';
    showNewCircle.value = false;
  } catch (err) {
    error.value = apiErrorMessage(err);
  }
}

async function removeMember(userId: string) {
  if (!board.currentCircleId) return;
  error.value = '';
  try {
    await board.removeMember(board.currentCircleId, userId);
    removingMemberId.value = null;
  } catch (err) {
    error.value = apiErrorMessage(err, 'Could not remove member');
  }
}

async function leaveCircle() {
  if (!board.currentCircleId) return;
  error.value = '';
  try {
    await board.leaveCircle(board.currentCircleId);
    confirmingLeave.value = false;
    showMemberList.value = false;
  } catch (err) {
    error.value = apiErrorMessage(err, 'Could not leave circle');
  }
}

function logout() {
  showAvatarMenu.value = false;
  notifications.reset();
  board.reset();
  auth.logout();
  router.push({ name: 'sign-in' });
}

function toggleAvatarMenu() {
  showAvatarMenu.value = !showAvatarMenu.value;
}

function closeAvatarMenu() {
  showAvatarMenu.value = false;
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- Top bar -->
    <header class="bg-surface fixed top-0 w-full z-40 border-b border-surface-container">
      <nav class="flex justify-between items-center w-full px-container-padding-mobile sm:px-container-padding-desktop py-stack-sm max-w-[1440px] mx-auto gap-base">
        <div class="flex items-center gap-stack-sm min-w-0">
          <!-- Mobile sidebar toggle -->
          <button
            class="lg:hidden flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container transition-colors"
            @click="showSidebar = !showSidebar"
          >
            <span class="material-symbols-outlined text-on-surface-variant">menu</span>
          </button>
          <span class="font-headline-xl text-headline-md sm:text-headline-xl text-primary shrink-0">Taskettle</span>
        </div>

        <div class="flex items-center gap-base">
          <button
            v-if="hasCircle"
            class="bg-primary text-on-primary px-stack-sm sm:px-stack-md py-2 rounded-full font-label-md flex items-center gap-base hover:opacity-90 active:scale-95 transition-all"
            @click="showCreate = true"
          >
            <span class="material-symbols-outlined !text-[20px]">add</span>
            <span class="hidden sm:inline">Create Task</span>
          </button>
          <NotificationBell />
          <div v-if="auth.user" class="relative">
            <span
              class="w-10 h-10 rounded-full flex items-center justify-center text-on-primary font-semibold cursor-pointer hover:ring-2 hover:ring-primary transition-all"
              :style="{ backgroundColor: auth.user.avatarColor }"
              :title="auth.user.name"
              @click="toggleAvatarMenu"
            >
              {{ auth.user.name.charAt(0).toUpperCase() }}
            </span>
            <!-- Avatar dropdown menu -->
            <Transition
              enter-active-class="transition ease-out duration-150"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition ease-in duration-100"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div
                v-if="showAvatarMenu"
                class="absolute right-0 top-12 w-56 bg-surface rounded-xl shadow-lg border border-surface-container py-2 z-50"
              >
                <!-- Profile section -->
                <div class="px-4 py-3 border-b border-surface-container">
                  <p class="font-label-md text-on-surface truncate">{{ auth.user.name }}</p>
                  <p class="text-body-sm text-on-surface-variant truncate">{{ auth.user.email }}</p>
                </div>
                <!-- Menu items -->
                <button
                  class="w-full flex items-center gap-3 px-4 py-2.5 text-left text-body-md text-on-surface hover:bg-surface-container transition-colors"
                  @click="closeAvatarMenu(); router.push({ name: 'profile' })"
                >
                  <span class="material-symbols-outlined !text-[20px] text-on-surface-variant">person</span>
                  Profile
                </button>
                <button
                  class="w-full flex items-center gap-3 px-4 py-2.5 text-left text-body-md text-error hover:bg-error-container/30 transition-colors"
                  @click="logout"
                >
                  <span class="material-symbols-outlined !text-[20px]">logout</span>
                  Log out
                </button>
              </div>
            </Transition>
            <!-- Backdrop to close menu -->
            <div v-if="showAvatarMenu" class="fixed inset-0 z-40" @click="closeAvatarMenu" />
          </div>
        </div>
      </nav>
    </header>

    <div class="flex flex-1 pt-[72px]">
      <!-- Sidebar - desktop always visible, mobile overlay -->
      <aside
        class="fixed lg:sticky top-[72px] left-0 h-[calc(100vh-72px)] z-30 w-64 bg-surface-container-lowest border-r border-surface-container flex flex-col transition-transform duration-200 ease-in-out"
        :class="showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
      >
        <div class="flex-1 overflow-y-auto py-stack-sm px-3">
          <!-- Circles section -->
          <p class="px-3 pt-2 pb-1 text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Circles</p>
          <ul class="flex flex-col gap-0.5">
            <li v-for="c in board.circles" :key="c.id">
              <button
                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-body-md transition-colors"
                :class="board.currentCircleId === c.id ? 'bg-primary-container text-on-primary-container font-semibold' : 'text-on-surface hover:bg-surface-container'"
                @click="board.selectCircle(c.id); showSidebar = false"
              >
                <span class="material-symbols-outlined !text-[20px]">{{ c.icon || 'group' }}</span>
                <span class="truncate">{{ c.name }}</span>
                <span class="ml-auto text-label-sm text-on-surface-variant">{{ c.memberCount }}</span>
              </button>
            </li>
          </ul>

          <!-- New Circle button -->
          <button
            class="w-full flex items-center gap-3 px-3 py-2.5 mt-1 rounded-lg text-body-md text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
            @click="showNewCircle = true; showSidebar = false"
          >
            <span class="material-symbols-outlined !text-[20px]">add_circle_outline</span>
            New Circle
          </button>

          <!-- Divider -->
          <hr class="my-stack-sm border-surface-container" />

          <!-- Actions -->
          <p class="px-3 pt-2 pb-1 text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Actions</p>
          <button
            v-if="hasCircle"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-body-md text-on-surface hover:bg-surface-container transition-colors"
            @click="showInvite = true; showSidebar = false"
          >
            <span class="material-symbols-outlined !text-[20px] text-on-surface-variant">person_add</span>
            Invite Member
          </button>
          <button
            v-if="hasCircle"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-body-md text-on-surface hover:bg-surface-container transition-colors"
            @click="router.push({ name: 'inventory' }); showSidebar = false"
          >
            <span class="material-symbols-outlined !text-[20px] text-on-surface-variant">inventory_2</span>
            Inventory
          </button>
          <button
            v-if="hasCircle"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-body-md text-on-surface hover:bg-surface-container transition-colors"
            @click="router.push({ name: 'wallet' }); showSidebar = false"
          >
            <span class="material-symbols-outlined !text-[20px] text-on-surface-variant">account_balance_wallet</span>
            Family Wallet
          </button>
          <button
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-body-md text-on-surface hover:bg-surface-container transition-colors"
            @click="router.push({ name: 'profile' }); showSidebar = false"
          >
            <span class="material-symbols-outlined !text-[20px] text-on-surface-variant">person</span>
            Profile
          </button>
        </div>

        <!-- Sidebar footer -->
        <div v-if="auth.user" class="border-t border-surface-container px-3 py-3 flex items-center gap-3">
          <span
            class="w-9 h-9 rounded-full flex items-center justify-center text-on-primary font-semibold text-sm shrink-0"
            :style="{ backgroundColor: auth.user.avatarColor }"
          >
            {{ auth.user.name.charAt(0).toUpperCase() }}
          </span>
          <div class="min-w-0">
            <p class="text-label-md text-on-surface truncate">{{ auth.user.name }}</p>
            <p class="text-body-sm text-on-surface-variant truncate text-xs">{{ auth.user.email }}</p>
          </div>
        </div>
      </aside>

      <!-- Mobile sidebar backdrop -->
      <div
        v-if="showSidebar"
        class="fixed inset-0 z-20 bg-inverse-surface/30 backdrop-blur-sm lg:hidden"
        @click="showSidebar = false"
      />

      <!-- Main content -->
      <main class="flex-1 min-w-0 px-container-padding-mobile sm:px-container-padding-desktop flex flex-col min-h-0 max-w-[1120px] mx-auto w-full">
      <p v-if="error" class="mt-stack-sm bg-error-container text-on-error-container rounded-lg px-stack-sm py-base text-body-md">
        {{ error }}
      </p>

      <!-- No circle yet -->
      <div v-if="!hasCircle" class="flex-1 flex flex-col items-center justify-center text-center gap-stack-sm py-stack-lg">
        <div class="w-20 h-20 bg-primary-container rounded-xl flex items-center justify-center">
          <span class="material-symbols-outlined text-on-primary-container !text-[44px]">group_add</span>
        </div>
        <h2 class="font-headline-lg text-headline-lg text-on-surface">Start your first Circle</h2>
        <p class="text-body-md text-on-surface-variant max-w-[360px]">
          A Circle is your shared space — a household, a friend group, a project crew.
        </p>
        <button
          class="mt-base bg-primary text-on-primary px-stack-lg py-stack-sm rounded-full font-label-md shadow-md hover:bg-primary-container hover:text-on-primary-container active:scale-95 transition-all"
          @click="showNewCircle = true"
        >
          Create a Circle
        </button>
      </div>

      <!-- Board -->
      <template v-else>
        <div class="flex items-center justify-between py-stack-sm flex-wrap gap-base">
          <div class="flex items-center gap-stack-sm flex-wrap">
            <h1 class="font-headline-lg text-headline-md sm:text-headline-lg text-on-surface">
              {{ board.currentCircle?.name }}
            </h1>
            <div class="flex -space-x-2 relative">
              <button
                class="relative flex -space-x-2"
                :title="`${board.members.length} members`"
                @click="showMemberList = !showMemberList"
              >
                <span
                  v-for="m in board.members.slice(0, 5)"
                  :key="m.userId"
                  class="w-8 h-8 rounded-full border-2 border-surface flex items-center justify-center text-label-sm font-semibold text-on-primary cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                  :style="{ backgroundColor: m.avatarColor }"
                  :title="m.name"
                >
                  {{ m.name.charAt(0).toUpperCase() }}
                </span>
              </button>
              <!-- Member list dropdown -->
              <Transition
                enter-active-class="transition ease-out duration-150"
                enter-from-class="opacity-0 scale-95"
                enter-to-class="opacity-100 scale-100"
                leave-active-class="transition ease-in duration-100"
                leave-from-class="opacity-100 scale-100"
                leave-to-class="opacity-0 scale-95"
              >
                <div
                  v-if="showMemberList"
                  class="absolute top-10 left-0 z-40 w-72 bg-surface rounded-xl shadow-lg border border-surface-container py-2"
                >
                  <p class="px-4 py-2 text-label-md text-on-surface-variant uppercase tracking-wider">Members</p>
                  <div class="max-h-80 overflow-y-auto">
                    <div
                      v-for="m in board.members"
                      :key="m.userId"
                      class="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-surface-container transition-colors"
                    >
                      <div class="flex items-center gap-3 min-w-0">
                        <span
                          class="w-8 h-8 rounded-full flex items-center justify-center text-label-sm font-semibold text-on-primary shrink-0"
                          :style="{ backgroundColor: m.avatarColor }"
                        >
                          {{ m.name.charAt(0).toUpperCase() }}
                        </span>
                        <div class="min-w-0">
                          <p class="text-body-sm text-on-surface truncate">{{ m.name }}</p>
                          <p class="text-label-sm text-on-surface-variant">{{ m.role }}</p>
                        </div>
                      </div>
                      <div v-if="board.isCircleOwner && m.userId !== auth.user?.id" class="flex gap-1">
                        <button
                          class="p-1 rounded-full hover:bg-error-container/40 text-error transition-colors"
                          :title="`Remove ${m.name}`"
                          @click="removingMemberId = m.userId"
                        >
                          <span class="material-symbols-outlined !text-[18px]">close</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  <!-- Remove member confirmation -->
                  <div
                    v-if="removingMemberId"
                    class="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40"
                    @click.self="removingMemberId = null"
                  >
                    <div class="bg-surface-container-lowest rounded-xl shadow-float p-stack-md max-w-sm">
                      <p class="text-body-md text-on-surface mb-stack-sm">
                        Are you sure you want to remove
                        <strong>{{ board.members.find(m => m.userId === removingMemberId)?.name }}</strong> from this circle?
                      </p>
                      <div class="flex gap-stack-sm">
                        <button
                          class="flex-1 py-stack-sm rounded-full border border-secondary text-secondary font-label-md hover:bg-secondary-container/40 active:scale-95 transition-all"
                          @click="removingMemberId = null"
                        >
                          Cancel
                        </button>
                        <button
                          class="flex-1 py-stack-sm rounded-full bg-error text-on-error font-label-md shadow-md hover:bg-error-container hover:text-on-error-container active:scale-95 transition-all"
                          @click="removeMember(removingMemberId); removingMemberId = null"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                  <!-- Leave circle option (for non-owners) -->
                  <div
                    v-if="!board.isCircleOwner"
                    class="border-t border-surface-container mt-2 pt-2"
                  >
                    <button
                      class="w-full flex items-center gap-3 px-4 py-2.5 text-left text-body-md text-error hover:bg-error-container/30 transition-colors"
                      @click="confirmingLeave = true"
                    >
                      <span class="material-symbols-outlined !text-[18px]">logout</span>
                      Leave circle
                    </button>
                  </div>
                </div>
              </Transition>
              <!-- Leave circle confirmation -->
              <div
                v-if="confirmingLeave"
                class="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40"
                @click.self="confirmingLeave = false"
              >
                <div class="bg-surface-container-lowest rounded-xl shadow-float p-stack-md max-w-sm">
                  <p class="text-body-md text-on-surface mb-stack-sm">
                    Leave <strong>{{ board.currentCircle?.name }}</strong>? You won't be able to see tasks in this circle anymore.
                  </p>
                  <div class="flex gap-stack-sm">
                    <button
                      class="flex-1 py-stack-sm rounded-full border border-secondary text-secondary font-label-md hover:bg-secondary-container/40 active:scale-95 transition-all"
                      @click="confirmingLeave = false"
                    >
                      Cancel
                    </button>
                    <button
                      class="flex-1 py-stack-sm rounded-full bg-error text-on-error font-label-md shadow-md hover:bg-error-container hover:text-on-error-container active:scale-95 transition-all"
                      @click="leaveCircle"
                    >
                      Leave
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-base">
            <button
              v-if="board.isCircleOwner"
              class="border border-secondary text-secondary px-stack-sm py-2 rounded-full font-label-md hover:bg-secondary-container/40 active:scale-95 transition-all flex items-center gap-base"
              @click="showSettings = true"
              title="Circle settings"
            >
              <span class="material-symbols-outlined !text-[18px]">settings</span>
            </button>
            <button
              class="lg:hidden border border-secondary text-secondary px-stack-sm py-2 rounded-full font-label-md hover:bg-secondary-container/40 active:scale-95 transition-all flex items-center gap-base"
              @click="showInvite = true"
            >
              <span class="material-symbols-outlined !text-[18px]">person_add</span>
              <span class="hidden sm:inline">Invite</span>
            </button>
          </div>
        </div>

        <!-- Backdrop for member list -->
        <div
          v-if="showMemberList"
          class="fixed inset-0 z-30"
          @click="showMemberList = false"
        />

        <!-- Tabs -->
        <div class="flex gap-1 border-b border-surface-container mb-stack-sm">
          <button
            class="px-4 py-2.5 text-label-md font-semibold transition-colors relative"
            :class="activeTab === 'boards' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'"
            @click="activeTab = 'boards'"
          >
            Boards
            <span v-if="activeTab === 'boards'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          </button>
          <button
            class="px-4 py-2.5 text-label-md font-semibold transition-colors relative"
            :class="activeTab === 'schedule' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'"
            @click="activeTab = 'schedule'"
          >
            Schedule
            <span v-if="activeTab === 'schedule'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          </button>
        </div>

        <!-- Boards tab content -->
        <template v-if="activeTab === 'boards'">
          <!-- Search & Filter bar -->
          <div class="flex flex-wrap items-center gap-2 pb-stack-sm">
            <div class="relative flex-1 min-w-[180px] max-w-[320px]">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 !text-[20px] text-on-surface-variant">search</span>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search tasks..."
                class="w-full pl-10 pr-3 py-2 rounded-full bg-surface-container border border-transparent text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
            <select
              v-model="filterAssignee"
              class="rounded-full bg-surface-container border border-transparent py-2 px-3 text-body-md text-on-surface focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            >
              <option value="">All members</option>
              <option v-for="m in board.members" :key="m.userId" :value="m.userId">{{ m.name }}</option>
            </select>
            <button
              v-if="hasActiveFilters"
              class="flex items-center gap-1 text-body-sm text-on-surface-variant hover:text-error transition-colors"
              @click="searchQuery = ''; filterAssignee = ''"
            >
              <span class="material-symbols-outlined !text-[16px]">close</span>
              Clear
            </button>
          </div>

          <div class="flex gap-gutter overflow-x-auto custom-scrollbar pb-stack-md flex-1 min-h-0 items-stretch">
            <BoardColumn
              v-for="col in columns"
              :key="col.status"
              :title="col.title"
              :status="col.status"
              :accent="col.accent"
              :tasks="grouped[col.status]"
              @open="openTask"
              @drop="onDrop"
              @add="showCreate = true"
            />
          </div>
        </template>

        <!-- Schedule tab content -->
        <template v-if="activeTab === 'schedule'">
          <div class="flex flex-col gap-stack-sm flex-1 min-h-0">
            <!-- Schedule header -->
            <div class="flex items-center justify-between flex-wrap gap-2">
              <p class="text-body-md text-on-surface-variant">Keep track of everyone's rhythm in one place.</p>
              <div class="flex items-center gap-2">
                <button class="p-2 rounded-full hover:bg-surface-container transition-colors" @click="prevMonth">
                  <span class="material-symbols-outlined !text-[20px] text-on-surface-variant">chevron_left</span>
                </button>
                <span class="font-label-md text-on-surface min-w-[140px] text-center">{{ displayMonth }}</span>
                <button class="p-2 rounded-full hover:bg-surface-container transition-colors" @click="nextMonth">
                  <span class="material-symbols-outlined !text-[20px] text-on-surface-variant">chevron_right</span>
                </button>
                <button
                  class="ml-2 px-3 py-1.5 rounded-full bg-surface-container text-label-md text-on-surface hover:bg-surface-container-high transition-colors"
                  @click="goToday"
                >
                  Today
                </button>
              </div>
            </div>

            <!-- Include other circles -->
            <div v-if="otherCircles.length" class="flex flex-wrap items-center gap-2">
              <span class="text-label-sm text-on-surface-variant">Include:</span>
              <button
                v-for="c in otherCircles"
                :key="c.id"
                class="px-3 py-1 rounded-full text-label-sm border transition-all"
                :class="includedCircleIds.includes(c.id) ? 'bg-primary-container text-on-primary-container border-primary-container' : 'bg-surface-container text-on-surface-variant border-surface-container hover:border-primary'"
                @click="toggleCircleInclusion(c.id)"
              >
                {{ c.name }}
              </button>
              <span v-if="loadingOtherTasks" class="material-symbols-outlined animate-spin !text-[16px] text-on-surface-variant">progress_activity</span>
            </div>

            <!-- Calendar grid -->
            <div class="bg-surface-container-lowest rounded-xl border border-surface-container overflow-hidden shadow-sm flex-1">
              <!-- Day headers -->
              <div class="grid grid-cols-7 border-b border-surface-container">
                <div
                  v-for="day in dayNames"
                  :key="day"
                  class="py-3 text-center text-label-md text-on-surface-variant font-semibold"
                >
                  {{ day }}
                </div>
              </div>

              <!-- Day cells -->
              <div class="grid grid-cols-7">
                <div
                  v-for="(day, idx) in calendarDays"
                  :key="idx"
                  class="min-h-[80px] sm:min-h-[100px] p-1.5 border-b border-r border-surface-container relative"
                  :class="[
                    !day.isCurrentMonth && 'bg-surface-container/30',
                    day.isToday && 'ring-2 ring-inset ring-primary/40',
                  ]"
                >
                  <span
                    class="text-body-sm font-medium"
                    :class="day.isToday ? 'text-primary font-bold' : day.isCurrentMonth ? 'text-on-surface' : 'text-on-surface-variant/50'"
                  >
                    {{ day.date }}
                    <span v-if="day.isToday" class="text-xs ml-0.5">Today</span>
                  </span>

                  <div class="mt-1 flex flex-col gap-0.5">
                    <div
                      v-for="task in day.tasks.slice(0, 2)"
                      :key="task.id"
                      class="text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80 transition-opacity"
                      :style="{ backgroundColor: taskColor(task) }"
                      :title="task.title"
                      @click="openTask(task)"
                    >
                      {{ task.title }}
                    </div>
                    <span v-if="day.tasks.length > 2" class="text-xs text-on-surface-variant pl-1">
                      +{{ day.tasks.length - 2 }} more
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Summary cards -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-stack-sm mt-stack-sm">
              <div class="bg-surface-container-lowest rounded-xl border border-surface-container p-stack-md flex items-start gap-stack-sm">
                <div class="w-12 h-12 rounded-lg bg-primary-container flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-on-primary-container !text-[24px]">event_upcoming</span>
                </div>
                <div>
                  <h3 class="font-label-md text-on-surface font-semibold">Weekend Harmony</h3>
                  <p class="text-body-sm text-on-surface-variant mt-1">
                    {{ upcomingCount }} {{ upcomingCount === 1 ? 'task' : 'tasks' }} coming up this week.
                  </p>
                </div>
              </div>
              <div class="bg-surface-container-lowest rounded-xl border border-surface-container p-stack-md">
                <p class="text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Family Pulse</p>
                <p class="font-headline-lg text-headline-md text-on-surface mt-1">{{ completedThisWeek }}%</p>
                <p class="text-body-sm text-on-surface-variant mt-1">Tasks completed this week.</p>
                <div class="mt-2 h-2 bg-surface-container rounded-full overflow-hidden">
                  <div class="h-full bg-primary rounded-full transition-all duration-500" :style="{ width: `${completedThisWeek}%` }" />
                </div>
              </div>
            </div>
          </div>
        </template>
      </template>
    </main>
    </div>

    <!-- Modals -->
    <CreateTaskModal v-if="showCreate" @close="showCreate = false" />
    <TaskDetailModal v-if="selectedTask" :task="selectedTask" @close="selectedTask = null" />
    <InviteMemberModal v-if="showInvite" @close="showInvite = false" />
    <CircleSettingsModal v-if="showSettings" @close="showSettings = false" />

    <div
      v-if="showNewCircle"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-inverse-surface/40 backdrop-blur-sm p-0 sm:p-stack-md"
      @click.self="showNewCircle = false"
    >
      <div class="w-full sm:max-w-[420px] bg-surface-container-lowest rounded-t-xl sm:rounded-xl shadow-float p-stack-md flex flex-col gap-stack-sm">
        <h3 class="font-headline text-headline-md text-on-surface">New Circle</h3>
        <input
          v-model="newCircleName"
          type="text"
          placeholder="e.g. The Sato Household"
          class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
          @keyup.enter="createCircle"
        />
        <div class="flex gap-stack-sm mt-base">
          <button
            class="flex-1 py-stack-sm rounded-full border border-secondary text-secondary font-label-md active:scale-95 transition-all"
            @click="showNewCircle = false"
          >
            Cancel
          </button>
          <button
            class="flex-1 py-stack-sm rounded-full bg-primary text-on-primary font-label-md shadow-md hover:bg-primary-container hover:text-on-primary-container active:scale-95 transition-all"
            @click="createCircle"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
