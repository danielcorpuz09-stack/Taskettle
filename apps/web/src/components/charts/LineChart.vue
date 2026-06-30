<script setup lang="ts">
import { computed } from 'vue';
import { Line } from 'vue-chartjs';
import type { ChartData, ChartOptions } from 'chart.js';
import './register';

const props = defineProps<{
  data: ChartData<'line'>;
  options?: ChartOptions<'line'>;
}>();

const merged = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  ...props.options,
}));
</script>

<template>
  <Line :data="data" :options="merged" />
</template>
