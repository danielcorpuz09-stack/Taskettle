<script setup lang="ts">
import { reactive, ref } from 'vue';
import BaseModal from './BaseModal.vue';
import { useBoardStore } from '@/stores/board';
import { apiErrorMessage } from '@/lib/api';
import { fromDateTimeLocal } from '@/lib/date';
import type { TaskStatus } from '@/types';

const props = withDefaults(defineProps<{ initialStatus?: TaskStatus }>(), { initialStatus: 'TODO' });
const board = useBoardStore();
const emit = defineEmits<{ (e: 'close'): void }>();

const form = reactive({ title: '', description: '', assigneeId: '', dueDateLocal: '', priority: 'MEDIUM', category: '' });
const error = ref('');
const saving = ref(false);

const CATEGORIES = ['Chores', 'Errands', 'Health', 'School', 'Work', 'Fun', 'Meals', 'Other'];

async function submit() {
  if (!form.title.trim()) return;
  error.value = '';
  saving.value = true;
  try {
    await board.createTask({
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      assigneeId: form.assigneeId || null,
      dueDate: fromDateTimeLocal(form.dueDateLocal),
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
          <label class="font-label-md text-label-md text-on-surface" for="due">Due date</label>
          <input
            id="due"
            v-model="form.dueDateLocal"
            type="datetime-local"
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
