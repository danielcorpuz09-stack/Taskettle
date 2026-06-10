<script setup lang="ts">
import type { InventoryDashboard } from '@/types';

defineProps<{ dashboard: InventoryDashboard }>();
const emit = defineEmits<{ (e: 'filter', status: string): void }>();
</script>

<template>
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-stack-sm mb-stack-sm">
    <button
      class="bg-surface-container-lowest rounded-xl border border-surface-container p-stack-sm text-left hover:border-primary transition-colors"
      @click="emit('filter', '')"
    >
      <p class="text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Total Items</p>
      <p class="font-headline-lg text-headline-md text-on-surface mt-1">{{ dashboard.totalCount }}</p>
    </button>

    <button
      class="bg-surface-container-lowest rounded-xl border border-surface-container p-stack-sm text-left hover:border-primary transition-colors"
      @click="emit('filter', 'IN_STOCK')"
    >
      <p class="text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">In Stock</p>
      <p class="font-headline-lg text-headline-md text-primary mt-1">{{ dashboard.totalCount - dashboard.lowStockCount - dashboard.outOfStockCount }}</p>
    </button>

    <button
      class="bg-surface-container-lowest rounded-xl border border-secondary-container p-stack-sm text-left hover:border-secondary transition-colors"
      @click="emit('filter', 'LOW_STOCK')"
    >
      <p class="text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Low Stock</p>
      <p class="font-headline-lg text-headline-md text-secondary mt-1">{{ dashboard.lowStockCount }}</p>
      <p v-if="dashboard.lowStockCount > 0" class="text-body-sm text-secondary mt-0.5">Needs attention</p>
    </button>

    <button
      class="bg-surface-container-lowest rounded-xl border border-error-container p-stack-sm text-left hover:border-error transition-colors"
      @click="emit('filter', 'OUT_OF_STOCK')"
    >
      <p class="text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Out of Stock</p>
      <p class="font-headline-lg text-headline-md text-error mt-1">{{ dashboard.outOfStockCount }}</p>
      <p v-if="dashboard.outOfStockCount > 0" class="text-body-sm text-error mt-0.5">Replenish now</p>
    </button>
  </div>
</template>
