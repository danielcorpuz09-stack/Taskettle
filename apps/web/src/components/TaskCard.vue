<script setup lang="ts">
import { computed } from 'vue';
import type { Task } from '@/types';
import { dueState, formatDueLabel } from '@/lib/date';

const props = defineProps<{ task: Task }>();
defineEmits<{ (e: 'open', task: Task): void }>();

const isDone = computed(() => props.task.status === 'DONE');
const due = computed(() => dueState(props.task.dueDate, isDone.value));

const priorityBadge = computed(() => {
  switch (props.task.priority) {
    case 'URGENT': return { label: 'Urgent', cls: 'bg-error-container text-on-error-container' };
    case 'HIGH': return { label: 'High', cls: 'bg-secondary-container text-on-secondary-container' };
    case 'MEDIUM': return { label: 'Medium', cls: 'bg-tertiary-container text-on-tertiary-container' };
    case 'LOW': return { label: 'Low', cls: 'bg-surface-container-high text-on-surface-variant' };
    default: return null;
  }
});

const dueClasses = computed(() => {
  switch (due.value) {
    case 'overdue':
      return 'bg-error-container text-on-error-container';
    case 'soon':
      return 'bg-secondary-container text-on-secondary-container';
    case 'upcoming':
      return 'bg-primary-fixed text-on-primary-container';
    default:
      return 'bg-surface-container-high text-on-surface-variant';
  }
});

function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
</script>

<template>
  <article
    class="group bg-surface-container-lowest rounded-lg p-stack-sm shadow-card border border-transparent hover:border-primary-container cursor-pointer transition-all active:scale-[0.99]"
    :class="{ 'opacity-70': isDone }"
    @click="$emit('open', task)"
  >
    <h4
      class="font-headline text-body-md font-semibold text-on-surface leading-snug"
      :class="{ 'line-through text-on-surface-variant': isDone }"
    >
      {{ task.title }}
    </h4>
    <p v-if="task.description" class="mt-1 text-label-sm text-on-surface-variant line-clamp-2">
      {{ task.description }}
    </p>

    <!-- Priority & Category badges -->
    <div v-if="priorityBadge || task.category" class="mt-1.5 flex flex-wrap gap-1">
      <span v-if="priorityBadge" class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium" :class="priorityBadge.cls">
        {{ priorityBadge.label }}
      </span>
      <span v-if="task.category" class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-tertiary-container text-on-tertiary-container">
        {{ task.category }}
      </span>
    </div>

    <div class="mt-stack-sm flex items-center justify-between gap-base">
      <span
        v-if="task.dueDate"
        class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-label-sm font-medium"
        :class="dueClasses"
      >
        <span class="material-symbols-outlined !text-[14px]">schedule</span>
        {{ formatDueLabel(task.dueDate) }}
      </span>
      <span v-else class="text-label-sm text-outline">No due date</span>

      <span
        v-if="task.assignee"
        class="w-7 h-7 rounded-full flex items-center justify-center text-label-sm font-semibold text-on-primary shrink-0"
        :style="{ backgroundColor: task.assignee.avatarColor }"
        :title="task.assignee.name"
      >
        {{ initials(task.assignee.name) }}
      </span>
    </div>
  </article>
</template>
