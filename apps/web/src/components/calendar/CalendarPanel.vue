<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import type { Task, TaskRecurrence } from '@/types';
import { formatTimeRange, isoFromDateAndTime, minutesIntoDay } from '@/lib/date';

const props = defineProps<{ tasks: Task[] }>();
const emit = defineEmits<{
  (e: 'open', task: Task): void;
  (e: 'create', payload: { iso: string }): void;
  (e: 'update', payload: { taskId: string; patch: Record<string, unknown> }): void;
}>();

type CalView = 'month' | 'week' | 'day' | 'agenda';
const view = ref<CalView>('month');
const cursor = ref(new Date()); // anchor date for the current view

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOUR_PX = 48;
const hours = Array.from({ length: 24 }, (_, i) => i);

const today = new Date();
function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

// ---------------------------------------------------------------------------
// Occurrence expansion (handles recurring tasks within a visible window)
// ---------------------------------------------------------------------------
interface CalEvent {
  key: string;
  task: Task;
  start: Date;
  end: Date | null;
  allDay: boolean;
}

function stepDate(d: Date, freq: TaskRecurrence): Date {
  const r = new Date(d);
  if (freq === 'DAILY') r.setDate(r.getDate() + 1);
  else if (freq === 'WEEKLY') r.setDate(r.getDate() + 7);
  else r.setMonth(r.getMonth() + 1);
  return r;
}

function expand(rangeStart: Date, rangeEnd: Date): CalEvent[] {
  const events: CalEvent[] = [];
  for (const task of props.tasks) {
    if (!task.dueDate) continue;
    const baseStart = new Date(task.dueDate);
    const duration = task.endAt ? new Date(task.endAt).getTime() - baseStart.getTime() : 0;

    if (!task.recurrence) {
      if (baseStart >= rangeStart && baseStart <= rangeEnd) {
        events.push({
          key: task.id,
          task,
          start: baseStart,
          end: task.endAt ? new Date(task.endAt) : null,
          allDay: task.allDay,
        });
      }
      continue;
    }

    // Recurring: walk occurrences from the base start until the range end.
    const until = task.recurrenceUntil ? new Date(task.recurrenceUntil) : null;
    let occ = new Date(baseStart);
    let guard = 0;
    while (occ <= rangeEnd && guard < 400) {
      guard++;
      if (until && occ > until) break;
      if (occ >= rangeStart) {
        const end = duration > 0 ? new Date(occ.getTime() + duration) : null;
        events.push({
          key: `${task.id}::${occ.getTime()}`,
          task,
          start: new Date(occ),
          end,
          allDay: task.allDay,
        });
      }
      occ = stepDate(occ, task.recurrence);
    }
  }
  return events.sort((a, b) => a.start.getTime() - b.start.getTime());
}

function eventClasses(ev: CalEvent): string {
  if (ev.task.status === 'DONE') return 'bg-primary-container text-on-primary-container';
  if (ev.start < today) return 'bg-error-container text-on-error-container';
  return 'bg-secondary-container text-on-secondary-container';
}

// ---------------------------------------------------------------------------
// Header label + navigation
// ---------------------------------------------------------------------------
const headerLabel = computed(() => {
  const c = cursor.value;
  if (view.value === 'month') return `${monthNames[c.getMonth()]} ${c.getFullYear()}`;
  if (view.value === 'day') {
    return c.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  }
  if (view.value === 'week') {
    const s = weekStart.value;
    const e = addDays(s, 6);
    return `${s.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  }
  return 'Upcoming';
});

function navigate(dir: number) {
  const c = new Date(cursor.value);
  if (view.value === 'month') c.setMonth(c.getMonth() + dir);
  else if (view.value === 'week') c.setDate(c.getDate() + dir * 7);
  else if (view.value === 'day') c.setDate(c.getDate() + dir);
  else c.setDate(c.getDate() + dir * 30);
  cursor.value = c;
}
function goToday() {
  cursor.value = new Date();
}

// ---------------------------------------------------------------------------
// Month grid
// ---------------------------------------------------------------------------
interface MonthCell {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  events: CalEvent[];
}
const monthCells = computed((): MonthCell[] => {
  const year = cursor.value.getFullYear();
  const month = cursor.value.getMonth();
  const first = new Date(year, month, 1);
  const gridStart = addDays(startOfDay(first), -first.getDay());
  const gridEnd = addDays(gridStart, 41);
  const events = expand(gridStart, new Date(gridEnd.getFullYear(), gridEnd.getMonth(), gridEnd.getDate(), 23, 59, 59));

  const cells: MonthCell[] = [];
  for (let i = 0; i < 42; i++) {
    const date = addDays(gridStart, i);
    cells.push({
      date,
      inMonth: date.getMonth() === month,
      isToday: isSameDay(date, today),
      events: events.filter((ev) => isSameDay(ev.start, date)),
    });
  }
  return cells;
});

// ---------------------------------------------------------------------------
// Week / Day time grids
// ---------------------------------------------------------------------------
const weekStart = computed(() => addDays(startOfDay(cursor.value), -cursor.value.getDay()));
const weekDays = computed(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart.value, i)));
const visibleDays = computed(() => (view.value === 'day' ? [startOfDay(cursor.value)] : weekDays.value));

const timedEventsByDay = computed(() => {
  const days = visibleDays.value;
  const rangeStart = startOfDay(days[0]);
  const last = days[days.length - 1];
  const rangeEnd = new Date(last.getFullYear(), last.getMonth(), last.getDate(), 23, 59, 59);
  const events = expand(rangeStart, rangeEnd);
  return days.map((d) => ({
    date: d,
    isToday: isSameDay(d, today),
    allDay: events.filter((ev) => ev.allDay && isSameDay(ev.start, d)),
    timed: events.filter((ev) => !ev.allDay && isSameDay(ev.start, d)),
  }));
});

function eventTop(ev: CalEvent): number {
  return (minutesIntoDay(ev.start.toISOString()) / 60) * HOUR_PX;
}
function eventHeight(ev: CalEvent): number {
  if (!ev.end) return 22;
  const mins = (ev.end.getTime() - ev.start.getTime()) / 60000;
  return Math.max((mins / 60) * HOUR_PX, 22);
}

// ---------------------------------------------------------------------------
// Agenda
// ---------------------------------------------------------------------------
const agendaGroups = computed(() => {
  const start = startOfDay(cursor.value);
  const end = addDays(start, 60);
  const events = expand(start, new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59));
  const groups: { date: Date; events: CalEvent[] }[] = [];
  for (const ev of events) {
    const key = startOfDay(ev.start).getTime();
    let group = groups.find((g) => g.date.getTime() === key);
    if (!group) {
      group = { date: startOfDay(ev.start), events: [] };
      groups.push(group);
    }
    group.events.push(ev);
  }
  return groups;
});

function agendaDayLabel(d: Date): string {
  if (isSameDay(d, today)) return 'Today';
  if (isSameDay(d, addDays(today, 1))) return 'Tomorrow';
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

// ---------------------------------------------------------------------------
// Add / create
// ---------------------------------------------------------------------------
function addAllDay(date: Date) {
  emit('create', { iso: isoFromDateAndTime(date.getFullYear(), date.getMonth(), date.getDate(), '00:00') });
}
function addAtHour(date: Date, hour: number) {
  emit('create', {
    iso: isoFromDateAndTime(date.getFullYear(), date.getMonth(), date.getDate(), `${String(hour).padStart(2, '0')}:00`),
  });
}

// ---------------------------------------------------------------------------
// Context menu
// ---------------------------------------------------------------------------
interface MenuState {
  show: boolean;
  x: number;
  y: number;
  date: Date | null;
  event: CalEvent | null;
}
const menu = ref<MenuState>({ show: false, x: 0, y: 0, date: null, event: null });

function openDayMenu(e: MouseEvent, date: Date) {
  e.preventDefault();
  menu.value = { show: true, x: e.clientX, y: e.clientY, date, event: null };
}
function openEventMenu(e: MouseEvent, ev: CalEvent) {
  e.preventDefault();
  e.stopPropagation();
  menu.value = { show: true, x: e.clientX, y: e.clientY, date: null, event: ev };
}
function closeMenu() {
  menu.value.show = false;
}
function menuAddHere() {
  if (menu.value.date) addAllDay(menu.value.date);
  closeMenu();
}
function menuOpen() {
  if (menu.value.event) emit('open', menu.value.event.task);
  closeMenu();
}
function menuToggleDone() {
  const ev = menu.value.event;
  if (ev) {
    const next = ev.task.status === 'DONE' ? 'TODO' : 'DONE';
    emit('update', { taskId: ev.task.id, patch: { status: next } });
  }
  closeMenu();
}
function menuDelete() {
  const ev = menu.value.event;
  if (ev) emit('update', { taskId: ev.task.id, patch: { __delete: true } });
  closeMenu();
}

onMounted(() => window.addEventListener('click', closeMenu));
onUnmounted(() => window.removeEventListener('click', closeMenu));

// ---------------------------------------------------------------------------
// Drag to reschedule
// ---------------------------------------------------------------------------
const dragging = ref<CalEvent | null>(null);
function onDragStart(ev: CalEvent) {
  dragging.value = ev;
}
function onDropOnDay(date: Date) {
  const ev = dragging.value;
  dragging.value = null;
  if (!ev || isSameDay(ev.start, date)) return;
  const start = ev.start;
  const newStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), start.getHours(), start.getMinutes());
  const delta = newStart.getTime() - start.getTime();
  const newEnd = ev.end ? new Date(ev.end.getTime() + delta) : null;
  emit('update', {
    taskId: ev.task.id,
    patch: { dueDate: newStart.toISOString(), endAt: newEnd ? newEnd.toISOString() : null },
  });
}
function onDropOnSlot(date: Date, hour: number) {
  const ev = dragging.value;
  dragging.value = null;
  if (!ev) return;
  const duration = ev.end ? ev.end.getTime() - ev.start.getTime() : 0;
  const newStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, 0);
  const newEnd = duration > 0 ? new Date(newStart.getTime() + duration) : null;
  emit('update', {
    taskId: ev.task.id,
    patch: { dueDate: newStart.toISOString(), endAt: newEnd ? newEnd.toISOString() : null, allDay: false },
  });
}

const views: { id: CalView; label: string }[] = [
  { id: 'month', label: 'Month' },
  { id: 'week', label: 'Week' },
  { id: 'day', label: 'Day' },
  { id: 'agenda', label: 'Agenda' },
];

function eventTime(ev: CalEvent): string {
  return formatTimeRange(ev.start.toISOString(), ev.end ? ev.end.toISOString() : null, ev.allDay);
}
</script>

<template>
  <div class="flex flex-col gap-stack-sm flex-1 min-h-0">
    <!-- Toolbar -->
    <div class="flex items-center justify-between flex-wrap gap-2">
      <div class="flex items-center gap-2">
        <button class="p-2 rounded-full hover:bg-surface-container transition-colors" @click="navigate(-1)">
          <span class="material-symbols-outlined !text-[20px] text-on-surface-variant">chevron_left</span>
        </button>
        <span class="font-label-md text-on-surface min-w-[150px] text-center">{{ headerLabel }}</span>
        <button class="p-2 rounded-full hover:bg-surface-container transition-colors" @click="navigate(1)">
          <span class="material-symbols-outlined !text-[20px] text-on-surface-variant">chevron_right</span>
        </button>
        <button
          class="ml-1 px-3 py-1.5 rounded-full bg-surface-container text-label-md text-on-surface hover:bg-surface-container-high transition-colors"
          @click="goToday"
        >
          Today
        </button>
      </div>
      <div class="flex items-center gap-1 bg-surface-container rounded-full p-1">
        <button
          v-for="v in views"
          :key="v.id"
          class="px-3 py-1.5 rounded-full text-label-sm font-semibold transition-colors"
          :class="view === v.id ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'"
          @click="view = v.id"
        >
          {{ v.label }}
        </button>
      </div>
    </div>

    <!-- MONTH -->
    <div
      v-if="view === 'month'"
      class="bg-surface-container-lowest rounded-xl border border-surface-container overflow-hidden shadow-sm flex-1"
    >
      <div class="grid grid-cols-7 border-b border-surface-container">
        <div
          v-for="d in dayNames"
          :key="d"
          class="py-2.5 text-center text-label-sm text-on-surface-variant font-semibold"
        >
          {{ d }}
        </div>
      </div>
      <div class="grid grid-cols-7">
        <div
          v-for="cell in monthCells"
          :key="cell.date.toISOString()"
          class="min-h-[84px] sm:min-h-[104px] p-1.5 border-b border-r border-surface-container relative group"
          :class="[
            !cell.inMonth && 'bg-surface-container/30',
            cell.isToday && 'ring-2 ring-inset ring-primary/40',
          ]"
          @click="addAllDay(cell.date)"
          @contextmenu="openDayMenu($event, cell.date)"
          @dragover.prevent
          @drop="onDropOnDay(cell.date)"
        >
          <div class="flex items-center justify-between">
            <span
              class="text-body-sm font-medium"
              :class="cell.isToday ? 'text-primary font-bold' : cell.inMonth ? 'text-on-surface' : 'text-on-surface-variant/50'"
            >
              {{ cell.date.getDate() }}
            </span>
            <span
              class="material-symbols-outlined !text-[16px] text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity"
            >add</span>
          </div>
          <div class="mt-1 flex flex-col gap-0.5">
            <div
              v-for="ev in cell.events.slice(0, 3)"
              :key="ev.key"
              draggable="true"
              class="text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1"
              :class="eventClasses(ev)"
              :title="ev.task.title"
              @click.stop="emit('open', ev.task)"
              @contextmenu="openEventMenu($event, ev)"
              @dragstart="onDragStart(ev)"
            >
              <span v-if="ev.task.recurrence" class="material-symbols-outlined !text-[12px]">repeat</span>
              <span class="truncate">{{ ev.task.title }}</span>
            </div>
            <span v-if="cell.events.length > 3" class="text-xs text-on-surface-variant pl-1">
              +{{ cell.events.length - 3 }} more
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- WEEK / DAY -->
    <div
      v-else-if="view === 'week' || view === 'day'"
      class="bg-surface-container-lowest rounded-xl border border-surface-container overflow-hidden shadow-sm flex-1 flex flex-col min-h-0"
    >
      <!-- Day headers + all-day row -->
      <div class="flex border-b border-surface-container">
        <div class="w-14 shrink-0 border-r border-surface-container"></div>
        <div class="flex-1 grid" :style="{ gridTemplateColumns: `repeat(${visibleDays.length}, minmax(0, 1fr))` }">
          <div
            v-for="col in timedEventsByDay"
            :key="col.date.toISOString()"
            class="border-r border-surface-container px-1 py-2"
          >
            <div class="text-center">
              <p class="text-label-sm text-on-surface-variant">{{ dayNames[col.date.getDay()] }}</p>
              <p
                class="text-body-md font-semibold"
                :class="col.isToday ? 'text-primary' : 'text-on-surface'"
              >{{ col.date.getDate() }}</p>
            </div>
            <div class="mt-1 flex flex-col gap-0.5">
              <div
                v-for="ev in col.allDay"
                :key="ev.key"
                draggable="true"
                class="text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80"
                :class="eventClasses(ev)"
                :title="ev.task.title"
                @click.stop="emit('open', ev.task)"
                @contextmenu="openEventMenu($event, ev)"
                @dragstart="onDragStart(ev)"
              >
                {{ ev.task.title }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Scrollable hour grid -->
      <div class="flex-1 overflow-y-auto custom-scrollbar">
        <div class="flex">
          <!-- Hour labels -->
          <div class="w-14 shrink-0 border-r border-surface-container">
            <div
              v-for="h in hours"
              :key="h"
              class="text-right pr-2 text-label-sm text-on-surface-variant"
              :style="{ height: HOUR_PX + 'px' }"
            >
              <span class="relative -top-2">{{ h === 0 ? '' : `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? 'AM' : 'PM'}` }}</span>
            </div>
          </div>
          <!-- Day columns -->
          <div class="flex-1 grid" :style="{ gridTemplateColumns: `repeat(${visibleDays.length}, minmax(0, 1fr))` }">
            <div
              v-for="col in timedEventsByDay"
              :key="col.date.toISOString()"
              class="relative border-r border-surface-container"
            >
              <!-- Hour cells (click + drop targets) -->
              <div
                v-for="h in hours"
                :key="h"
                class="border-b border-surface-container/60 hover:bg-surface-container/40 transition-colors cursor-pointer"
                :style="{ height: HOUR_PX + 'px' }"
                @click="addAtHour(col.date, h)"
                @contextmenu="openDayMenu($event, col.date)"
                @dragover.prevent
                @drop="onDropOnSlot(col.date, h)"
              ></div>
              <!-- Timed events overlay -->
              <div class="absolute inset-0 pointer-events-none">
                <div
                  v-for="ev in col.timed"
                  :key="ev.key"
                  draggable="true"
                  class="absolute left-0.5 right-0.5 rounded px-1.5 py-0.5 text-xs overflow-hidden cursor-pointer pointer-events-auto shadow-sm"
                  :class="eventClasses(ev)"
                  :style="{ top: eventTop(ev) + 'px', height: eventHeight(ev) + 'px' }"
                  :title="ev.task.title"
                  @click.stop="emit('open', ev.task)"
                  @contextmenu="openEventMenu($event, ev)"
                  @dragstart="onDragStart(ev)"
                >
                  <span class="font-semibold truncate block">{{ ev.task.title }}</span>
                  <span class="opacity-80">{{ eventTime(ev) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- AGENDA -->
    <div
      v-else
      class="bg-surface-container-lowest rounded-xl border border-surface-container shadow-sm flex-1 overflow-y-auto custom-scrollbar p-stack-sm"
    >
      <p v-if="agendaGroups.length === 0" class="text-center text-on-surface-variant py-stack-lg">
        Nothing scheduled in the next 60 days.
      </p>
      <div v-for="group in agendaGroups" :key="group.date.toISOString()" class="mb-stack-sm">
        <p class="text-label-md font-semibold text-on-surface px-1 py-1 sticky top-0 bg-surface-container-lowest">
          {{ agendaDayLabel(group.date) }}
        </p>
        <div class="flex flex-col gap-1">
          <button
            v-for="ev in group.events"
            :key="ev.key"
            type="button"
            class="flex items-center gap-stack-sm w-full text-left px-2 py-2 rounded-lg hover:bg-surface-container transition-colors"
            @click="emit('open', ev.task)"
            @contextmenu="openEventMenu($event, ev)"
          >
            <span class="w-2 h-2 rounded-full shrink-0" :class="eventClasses(ev)"></span>
            <span class="w-24 shrink-0 text-body-sm text-on-surface-variant">{{ eventTime(ev) }}</span>
            <span class="flex-1 text-body-md text-on-surface truncate flex items-center gap-1">
              <span v-if="ev.task.recurrence" class="material-symbols-outlined !text-[14px] text-on-surface-variant">repeat</span>
              {{ ev.task.title }}
            </span>
            <span v-if="ev.task.status === 'DONE'" class="material-symbols-outlined !text-[18px] text-primary">check_circle</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Context menu -->
    <div
      v-if="menu.show"
      class="fixed z-50 min-w-[170px] bg-surface-container-lowest rounded-xl border border-surface-container shadow-lg py-1.5"
      :style="{ top: menu.y + 'px', left: menu.x + 'px' }"
      @click.stop
    >
      <template v-if="menu.date">
        <button class="menu-item" @click="menuAddHere">
          <span class="material-symbols-outlined !text-[18px]">add</span> Add task here
        </button>
      </template>
      <template v-else-if="menu.event">
        <button class="menu-item" @click="menuOpen">
          <span class="material-symbols-outlined !text-[18px]">open_in_new</span> Open
        </button>
        <button class="menu-item" @click="menuToggleDone">
          <span class="material-symbols-outlined !text-[18px]">
            {{ menu.event.task.status === 'DONE' ? 'undo' : 'check_circle' }}
          </span>
          {{ menu.event.task.status === 'DONE' ? 'Mark not done' : 'Mark done' }}
        </button>
        <button class="menu-item text-error" @click="menuDelete">
          <span class="material-symbols-outlined !text-[18px]">delete</span> Delete
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.menu-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  text-align: left;
  padding: 0.5rem 0.875rem;
  font-size: 0.875rem;
  color: var(--color-on-surface, inherit);
}
.menu-item:hover {
  background: rgb(0 0 0 / 0.04);
}
</style>
