<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import BaseModal from './BaseModal.vue';
import { useBoardStore } from '@/stores/board';
import { apiErrorMessage } from '@/lib/api';
import { fromDateTimeLocal, toDateTimeLocal } from '@/lib/date';
import type { Task, TaskStatus } from '@/types';

const props = defineProps<{ task: Task }>();
const emit = defineEmits<{ (e: 'close'): void }>();

const board = useBoardStore();

const CATEGORIES = ['Chores', 'Errands', 'Health', 'School', 'Work', 'Fun', 'Meals', 'Other'];

const form = reactive({
  title: props.task.title,
  description: props.task.description ?? '',
  assigneeId: props.task.assignee?.userId ?? '',
  status: props.task.status as TaskStatus,
  dueDateLocal: toDateTimeLocal(props.task.dueDate),
  priority: props.task.priority ?? 'MEDIUM',
  category: props.task.category ?? '',
});
const error = ref('');
const saving = ref(false);
const deleting = ref(false);

watch(
  () => props.task,
  (t) => {
    form.title = t.title;
    form.description = t.description ?? '';
    form.assigneeId = t.assignee?.userId ?? '';
    form.status = t.status;
    form.dueDateLocal = toDateTimeLocal(t.dueDate);
    form.priority = t.priority ?? 'MEDIUM';
    form.category = t.category ?? '';
  }
);

const statuses: { value: TaskStatus; label: string }[] = [
  { value: 'BACKLOG', label: 'Backlog' },
  { value: 'TODO', label: 'To Do' },
  { value: 'DOING', label: 'Doing' },
  { value: 'DONE', label: 'Done' },
];

async function save() {
  error.value = '';
  saving.value = true;
  try {
    await board.updateTask(props.task.id, {
      title: form.title.trim(),
      description: form.description.trim() || null,
      assigneeId: form.assigneeId || null,
      status: form.status,
      dueDate: fromDateTimeLocal(form.dueDateLocal),
      priority: form.priority,
      category: form.category || null,
    });
    emit('close');
  } catch (err) {
    error.value = apiErrorMessage(err, 'Could not save changes');
  } finally {
    saving.value = false;
  }
}

async function remove() {
  if (!confirm('Delete this task? This cannot be undone.')) return;
  deleting.value = true;
  try {
    await board.deleteTask(props.task.id);
    emit('close');
  } catch (err) {
    error.value = apiErrorMessage(err, 'Could not delete task');
  } finally {
    deleting.value = false;
  }
}
</script>

<template>
  <BaseModal title="Task details" @close="emit('close')">
    <form class="flex flex-col gap-stack-sm" @submit.prevent="save">
      <p v-if="error" class="bg-error-container text-on-error-container rounded-lg px-stack-sm py-base text-body-md">
        {{ error }}
      </p>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="d-title">Title</label>
        <input
          id="d-title"
          v-model="form.title"
          type="text"
          required
          class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
        />
      </div>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="d-desc">Notes</label>
        <textarea
          id="d-desc"
          v-model="form.description"
          rows="3"
          class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md resize-none"
        ></textarea>
      </div>

      <div class="flex flex-col gap-base">
        <span class="font-label-md text-label-md text-on-surface">Status</span>
        <div class="flex gap-base">
          <button
            v-for="s in statuses"
            :key="s.value"
            type="button"
            class="flex-1 py-2 rounded-full text-label-md border transition-all active:scale-95"
            :class="
              form.status === s.value
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-surface text-on-surface-variant border-outline-variant hover:border-primary'
            "
            @click="form.status = s.value"
          >
            {{ s.label }}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-stack-sm">
        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="d-assignee">Assign to</label>
          <select
            id="d-assignee"
            v-model="form.assigneeId"
            class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
          >
            <option value="">Anyone</option>
            <option v-for="m in board.members" :key="m.userId" :value="m.userId">{{ m.name }}</option>
          </select>
        </div>

        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="d-due">Due date</label>
          <input
            id="d-due"
            v-model="form.dueDateLocal"
            type="datetime-local"
            class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-stack-sm">
        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="d-priority">Priority</label>
          <select
            id="d-priority"
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
          <label class="font-label-md text-label-md text-on-surface" for="d-category">Category</label>
          <select
            id="d-category"
            v-model="form.category"
            class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
          >
            <option value="">None</option>
            <option v-for="cat in CATEGORIES" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>
      </div>

      <div class="flex items-center justify-between gap-stack-sm mt-base">
        <button
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
          class="py-stack-sm px-stack-lg rounded-full bg-primary text-on-primary font-label-md shadow-md hover:bg-primary-container hover:text-on-primary-container active:scale-95 transition-all disabled:opacity-60"
        >
          {{ saving ? 'Saving…' : 'Save' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>
