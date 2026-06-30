<script setup lang="ts">
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import type { ChartData, ChartOptions } from 'chart.js';
import './register';

const props = defineProps<{
  data: ChartData<'bar'>;
  options?: ChartOptions<'bar'>;
}>();

const merged = computed<ChartOptions<'bar'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  ...props.options,
}));
</script>

<template>
  <Bar :data="data" :options="merged" />
</template>
