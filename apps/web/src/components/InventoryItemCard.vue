<script setup lang="ts">
import { computed } from 'vue';
import type { InventoryItem } from '@/types';

const props = defineProps<{ item: InventoryItem }>();
defineEmits<{ (e: 'click'): void }>();

const statusBadge = computed(() => {
  switch (props.item.status) {
    case 'OUT_OF_STOCK':
      return { label: 'Out of Stock', cls: 'bg-error-container text-on-error-container' };
    case 'LOW_STOCK':
      return { label: 'Low Stock', cls: 'bg-secondary-container text-on-secondary-container' };
    default:
      return { label: 'In Stock', cls: 'bg-primary-container text-on-primary-container' };
  }
});
</script>

<template>
  <article
    class="bg-surface-container-lowest rounded-xl border border-surface-container p-stack-sm cursor-pointer hover:border-primary hover:shadow-sm transition-all active:scale-[0.98]"
    @click="$emit('click')"
  >
    <div class="flex items-start justify-between gap-2">
      <h3 class="font-label-md text-on-surface font-semibold line-clamp-1">{{ item.name }}</h3>
      <span
        class="shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
        :class="statusBadge.cls"
      >
        {{ statusBadge.label }}
      </span>
    </div>

    <p v-if="item.description" class="mt-1 text-body-sm text-on-surface-variant line-clamp-2">
      {{ item.description }}
    </p>

    <div class="mt-2 flex flex-wrap items-center gap-2 text-body-sm text-on-surface-variant">
      <span class="flex items-center gap-1">
        <span class="material-symbols-outlined !text-[16px]">scale</span>
        {{ item.quantity }} {{ item.unit || 'pcs' }}
      </span>
      <span v-if="item.location" class="flex items-center gap-1">
        <span class="material-symbols-outlined !text-[16px]">location_on</span>
        {{ item.location }}
      </span>
      <span v-if="item.category" class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-tertiary-container text-on-tertiary-container">
        {{ item.category }}
      </span>
    </div>

    <div v-if="item.minimumThreshold > 0" class="mt-2">
      <div class="h-1.5 bg-surface-container rounded-full overflow-hidden">
        <div
          class="h-full rounded-full transition-all duration-300"
          :class="item.status === 'OUT_OF_STOCK' ? 'bg-error' : item.status === 'LOW_STOCK' ? 'bg-secondary' : 'bg-primary'"
          :style="{ width: `${Math.min((item.quantity / Math.max(item.minimumThreshold * 2, 1)) * 100, 100)}%` }"
        />
      </div>
      <p class="text-[11px] text-on-surface-variant mt-0.5">Min: {{ item.minimumThreshold }} {{ item.unit || 'pcs' }}</p>
    </div>
  </article>
</template>
