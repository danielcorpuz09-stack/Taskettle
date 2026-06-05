<script setup lang="ts">
import draggable from 'vuedraggable';
import TaskCard from './TaskCard.vue';
import type { Task, TaskStatus } from '@/types';

defineProps<{
  title: string;
  status: TaskStatus;
  accent: string;
  tasks: Task[];
}>();

const emit = defineEmits<{
  (e: 'open', task: Task): void;
  (e: 'drop', payload: { taskId: string; status: TaskStatus; newIndex: number }): void;
  (e: 'add', status: TaskStatus): void;
}>();

// vuedraggable's update:modelValue mutates a local copy; we react to add events.
function onChange(status: TaskStatus, evt: any) {
  const moved = evt.added ?? evt.moved;
  if (!moved) return;
  emit('drop', { taskId: moved.element.id, status, newIndex: moved.newIndex });
}
</script>

<template>
  <section
    class="flex flex-col w-[88vw] sm:w-[300px] shrink-0 bg-surface-container-low rounded-xl p-stack-sm max-h-full"
  >
    <header class="flex items-center justify-between px-base pb-stack-sm">
      <div class="flex items-center gap-base">
        <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: accent }"></span>
        <h3 class="font-headline text-body-md font-semibold text-on-surface">{{ title }}</h3>
        <span class="text-label-sm text-on-surface-variant bg-surface-container-high rounded-full px-2 py-0.5">
          {{ tasks.length }}
        </span>
      </div>
      <button
        class="text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-full p-1 transition-colors"
        :aria-label="`Add task to ${title}`"
        @click="emit('add', status)"
      >
        <span class="material-symbols-outlined !text-[20px]">add</span>
      </button>
    </header>

    <draggable
      :model-value="tasks"
      :group="{ name: 'tasks' }"
      item-key="id"
      class="flex flex-col gap-base overflow-y-auto custom-scrollbar flex-1 min-h-[40px] px-base pb-base"
      ghost-class="drag-ghost"
      chosen-class="drag-chosen"
      :animation="150"
      @change="(e: any) => onChange(status, e)"
    >
      <template #item="{ element }">
        <TaskCard :task="element" @open="emit('open', element)" />
      </template>
    </draggable>

    <p
      v-if="!tasks.length"
      class="text-center text-label-sm text-outline py-stack-md select-none"
    >
      Nothing here yet
    </p>
  </section>
</template>
