<script setup lang="ts">
import { computed } from 'vue';
import { Doughnut } from 'vue-chartjs';
import type { ChartData, ChartOptions } from 'chart.js';
import './register';

const props = defineProps<{
  data: ChartData<'doughnut'>;
  options?: ChartOptions<'doughnut'>;
}>();

const merged = computed<ChartOptions<'doughnut'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '62%',
  ...props.options,
}));
</script>

<template>
  <Doughnut :data="data" :options="merged" />
</template>
