<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import BaseModal from './BaseModal.vue';
import { useMaintenanceStore } from '@/stores/maintenance';
import { useBoardStore } from '@/stores/board';
import { apiErrorMessage } from '@/lib/api';
import type { MaintenanceSchedule, MaintenanceFrequency } from '@/types';

const props = defineProps<{
  schedule?: MaintenanceSchedule | null;
}>();
const emit = defineEmits<{ (e: 'close'): void }>();

const board = useBoardStore();
const maintenance = useMaintenanceStore();

const FREQUENCIES: MaintenanceFrequency[] = ['WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL', 'CUSTOM'];

const form = reactive({
  title: '',
  description: '',
  frequency: 'MONTHLY' as MaintenanceFrequency,
  nextDueDate: '',
  assigneeId: '',
  notes: '',
});

const error = ref('');
const saving = ref(false);
const deleting = ref(false);
const isEditing = computed(() => !!props.schedule);

// Reset form when schedule prop changes
watch(
  () => props.schedule,
  (schedule) => {
    if (schedule) {
      form.title = schedule.title;
      form.description = schedule.description ?? '';
      form.frequency = schedule.frequency;
      form.nextDueDate = schedule.nextDueDate.split('T')[0];
      form.assigneeId = schedule.assigneeId ?? '';
      form.notes = schedule.notes ?? '';
    } else {
      form.title = '';
      form.description = '';
      form.frequency = 'MONTHLY';
      form.nextDueDate = '';
      form.assigneeId = '';
      form.notes = '';
    }
  },
  { immediate: true }
);

async function save() {
  if (!form.title.trim()) {
    error.value = 'Title is required';
    return;
  }
  if (!form.nextDueDate) {
    error.value = 'Next due date is required';
    return;
  }

  error.value = '';
  saving.value = true;
  try {
    const payload = {
      title: form.title.trim(),
      description: form.description || undefined,
      frequency: form.frequency,
      nextDueDate: form.nextDueDate,
      assigneeId: form.assigneeId || undefined,
      notes: form.notes || undefined,
    };

    if (isEditing.value && props.schedule) {
      await maintenance.updateSchedule(props.schedule.id, payload);
    } else {
      if (!board.currentCircleId) return;
      await maintenance.createSchedule(board.currentCircleId, payload);
    }
    emit('close');
  } catch (err) {
    error.value = apiErrorMessage(err, isEditing.value ? 'Could not save changes' : 'Could not create schedule');
  } finally {
    saving.value = false;
  }
}

async function remove() {
  if (!props.schedule) return;
  if (!confirm('Delete this schedule? This cannot be undone.')) return;

  deleting.value = true;
  try {
    await maintenance.deleteSchedule(props.schedule.id);
    emit('close');
  } catch (err) {
    error.value = apiErrorMessage(err, 'Could not delete schedule');
  } finally {
    deleting.value = false;
  }
}
</script>

<template>
  <BaseModal :title="isEditing ? 'Edit schedule' : 'New maintenance schedule'" @close="emit('close')">
    <form class="flex flex-col gap-stack-sm" @submit.prevent="save">
      <p v-if="error" class="bg-error-container text-on-error-container rounded-lg px-stack-sm py-base text-body-md">
        {{ error }}
      </p>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="maint-title">Title</label>
        <input
          id="maint-title"
          v-model="form.title"
          type="text"
          required
          placeholder="e.g., HVAC Filter Replacement"
          class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
        />
      </div>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="maint-desc">Description</label>
        <textarea
          id="maint-desc"
          v-model="form.description"
          rows="2"
          placeholder="Optional details…"
          class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md resize-none"
        ></textarea>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-stack-sm">
        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="maint-frequency">Frequency</label>
          <select
            id="maint-frequency"
            v-model="form.frequency"
            class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
          >
            <option v-for="freq in FREQUENCIES" :key="freq" :value="freq">{{ freq }}</option>
          </select>
        </div>

        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="maint-due">Next Due Date</label>
          <input
            id="maint-due"
            v-model="form.nextDueDate"
            type="date"
            required
            class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
          />
        </div>
      </div>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="maint-assignee">Assign to</label>
        <select
          id="maint-assignee"
          v-model="form.assigneeId"
          class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
        >
          <option value="">No one assigned</option>
          <option v-for="member in board.members" :key="member.userId" :value="member.userId">{{ member.name }}</option>
        </select>
      </div>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="maint-notes">Notes</label>
        <textarea
          id="maint-notes"
          v-model="form.notes"
          rows="3"
          placeholder="Any helpful details…"
          class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md resize-none"
        ></textarea>
      </div>

      <div class="flex items-center justify-between gap-stack-sm mt-base">
        <button
          v-if="isEditing"
          type="button"
          :disabled="deleting"
          class="text-error font-label-md flex items-center gap-1 hover:bg-error-container/40 px-3 py-2 rounded-full transition-colors disabled:opacity-60"
          @click="remove"
        >
          <span class="material-symbols-outlined !text-[18px]">delete</span>
          Delete
        </button>
        <button
          type="submit"
          :disabled="saving"
          class="py-stack-sm px-stack-lg rounded-full bg-primary text-on-primary font-label-md shadow-md hover:bg-primary-container hover:text-on-primary-container active:scale-95 transition-all disabled:opacity-60 ml-auto"
        >
          {{ saving ? 'Saving…' : 'Save' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>
