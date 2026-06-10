<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';

defineProps<{ title: string }>();
const emit = defineEmits<{ (e: 'close'): void }>();

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close');
}
onMounted(() => window.addEventListener('keydown', onKey));
onUnmounted(() => window.removeEventListener('keydown', onKey));
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-inverse-surface/40 backdrop-blur-sm p-0 sm:p-stack-md"
    @click.self="emit('close')"
  >
    <div
      class="w-full sm:max-w-[480px] bg-surface-container-lowest rounded-t-xl sm:rounded-xl shadow-float flex flex-col max-h-[90vh]"
    >
      <header class="flex items-center justify-between px-stack-md py-stack-sm border-b border-outline-variant/50">
        <h3 class="font-headline text-headline-md text-on-surface">{{ title }}</h3>
        <button
          class="text-on-surface-variant hover:bg-surface-container-high rounded-full p-1 transition-colors"
          aria-label="Close"
          @click="emit('close')"
        >
          <span class="material-symbols-outlined">close</span>
        </button>
      </header>
      <div class="overflow-y-auto p-stack-md">
        <slot />
      </div>
    </div>
  </div>
</template>
