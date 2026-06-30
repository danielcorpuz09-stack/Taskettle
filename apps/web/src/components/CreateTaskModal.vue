<script setup lang="ts">
import { reactive, ref } from 'vue';
import BaseModal from './BaseModal.vue';
import { useBoardStore } from '@/stores/board';
import { apiErrorMessage } from '@/lib/api';
import { toDateInput, timeLabel, isoFromDateAndTime } from '@/lib/date';
import type { TaskStatus, TaskRecurrence } from '@/types';

const props = withDefaults(
  defineProps<{ initialStatus?: TaskStatus; initialDueDate?: string | null }>(),
  { initialStatus: 'TODO', initialDueDate: null },
);
const board = useBoardStore();
const emit = defineEmits<{ (e: 'close'): void }>();

const hasInitialTime = Boolean(props.initialDueDate) && timeLabel(props.initialDueDate) !== '00:00';
const form = reactive({
  title: '',
  description: '',
  assigneeId: '',
  date: toDateInput(props.initialDueDate),
  allDay: !hasInitialTime,
  startTime: hasInitialTime ? timeLabel(props.initialDueDate) : '09:00',
  endTime: '',
  priority: 'MEDIUM',
  category: '',
  recurrence: '' as '' | TaskRecurrence,
});
const error = ref('');
const saving = ref(false);

const CATEGORIES = ['Chores', 'Errands', 'Health', 'School', 'Work', 'Fun', 'Meals', 'Other'];

function computeSchedule(): { dueDate: string | null; endAt: string | null } {
  if (!form.date) return { dueDate: null, endAt: null };
  const [y, m, d] = form.date.split('-').map(Number);
  if (form.allDay) {
    return { dueDate: isoFromDateAndTime(y, m - 1, d, '09:00'), endAt: null };
  }
  const dueDate = isoFromDateAndTime(y, m - 1, d, form.startTime || '09:00');
  const endAt = form.endTime ? isoFromDateAndTime(y, m - 1, d, form.endTime) : null;
  return { dueDate, endAt };
}

async function submit() {
  if (!form.title.trim()) return;
  const { dueDate, endAt } = computeSchedule();
  if (dueDate && endAt && new Date(endAt) < new Date(dueDate)) {
    error.value = 'End time must be after the start time.';
    return;
  }
  error.value = '';
  saving.value = true;
  try {
    await board.createTask({
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      assigneeId: form.assigneeId || null,
      dueDate,
      endAt,
      allDay: form.allDay,
      recurrence: form.recurrence || null,
      status: props.initialStatus,
      priority: form.priority as any,
      category: form.category || null,
    });
    emit('close');
  } catch (err) {
    error.value = apiErrorMessage(err, 'Could not create task');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <BaseModal title="New task" @close="emit('close')">
    <form class="flex flex-col gap-stack-sm" @submit.prevent="submit">
      <p v-if="error" class="bg-error-container text-on-error-container rounded-lg px-stack-sm py-base text-body-md">
        {{ error }}
      </p>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="title">Title</label>
        <input
          id="title"
          v-model="form.title"
          type="text"
          required
          placeholder="Water the garden…"
          class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
        />
      </div>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="desc">Notes (optional)</label>
        <textarea
          id="desc"
          v-model="form.description"
          rows="3"
          placeholder="Any helpful details…"
          class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md resize-none"
        ></textarea>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-stack-sm">
        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="assignee">Assign to</label>
          <select
            id="assignee"
            v-model="form.assigneeId"
            class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
          >
            <option value="">Anyone</option>
            <option v-for="m in board.members" :key="m.userId" :value="m.userId">{{ m.name }}</option>
          </select>
        </div>

        <div class="flex flex-col gap-base">
          <div class="flex items-center justify-between">
            <label class="font-label-md text-label-md text-on-surface" for="date">When</label>
            <label class="flex items-center gap-1.5 text-body-sm text-on-surface-variant cursor-pointer select-none">
              <input v-model="form.allDay" type="checkbox" class="accent-primary" />
              All-day
            </label>
          </div>
          <input
            id="date"
            v-model="form.date"
            type="date"
            class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
          />
        </div>
      </div>

      <div v-if="!form.allDay" class="grid grid-cols-2 gap-stack-sm">
        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="startTime">Start time</label>
          <input
            id="startTime"
            v-model="form.startTime"
            type="time"
            class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
          />
        </div>
        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="endTime">End time</label>
          <input
            id="endTime"
            v-model="form.endTime"
            type="time"
            class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-stack-sm">
        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="priority">Priority</label>
          <select
            id="priority"
            v-model="form.priority"
            class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>

        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="category">Category</label>
          <select
            id="category"
            v-model="form.category"
            class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
          >
            <option value="">None</option>
            <option v-for="cat in CATEGORIES" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>
      </div>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="repeat">Repeat</label>
        <select
          id="repeat"
          v-model="form.recurrence"
          class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
        >
          <option value="">Does not repeat</option>
          <option value="DAILY">Every day</option>
          <option value="WEEKLY">Every week</option>
          <option value="MONTHLY">Every month</option>
        </select>
      </div>

      <div class="flex gap-stack-sm mt-base">
        <button
          type="button"
          class="flex-1 py-stack-sm rounded-full border border-secondary text-secondary font-label-md hover:bg-secondary-container/40 active:scale-95 transition-all"
          @click="emit('close')"
        >
          Cancel
        </button>
        <button
          type="submit"
          :disabled="saving"
          class="flex-1 py-stack-sm rounded-full bg-primary text-on-primary font-label-md shadow-md hover:bg-primary-container hover:text-on-primary-container active:scale-95 transition-all disabled:opacity-60"
        >
          {{ saving ? 'Adding…' : 'Add task' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>
