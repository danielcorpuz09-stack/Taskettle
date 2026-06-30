<script setup lang="ts">
import { computed } from 'vue';
import type { ChartData, ChartOptions } from 'chart.js';
import { useWalletStore } from '@/stores/wallet';
import { formatMoney } from '@/lib/money';
import DonutChart from '@/components/charts/DonutChart.vue';
import BarChart from '@/components/charts/BarChart.vue';
import LineChart from '@/components/charts/LineChart.vue';

const wallet = useWalletStore();

// Cozy "Family Hearth" palette.
const SAGE = '#4c6455';
const ROSE = '#7b5455';
const LAVENDER = '#645a6f';
const ERROR = '#ba1a1a';

const currency = computed(() => wallet.analytics?.currency ?? 'USD');

const hasSpending = computed(
  () => (wallet.analytics?.spendingByCategory.length ?? 0) > 0
);
const hasPayees = computed(() => (wallet.analytics?.topPayees.length ?? 0) > 0);
const activeBudgets = computed(() => wallet.budgets.filter((b) => !b.archived));

/** 'YYYY-MM' → short month label, e.g. 'Jun'. */
function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'short' });
}

const toMajor = (minor: number) => minor / 100;
const fmt = (major: number) => formatMoney(Math.round(major * 100), currency.value);

/** Shared currency-formatted y-axis + tooltip for cartesian charts. */
function moneyScaleOptions(indexAxis: 'x' | 'y' = 'x'): ChartOptions<'bar' | 'line'> {
  const valueAxis = indexAxis === 'x' ? 'y' : 'x';
  return {
    indexAxis,
    plugins: {
      legend: { display: indexAxis === 'x' },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const raw = (valueAxis === 'y' ? ctx.parsed.y : ctx.parsed.x) ?? 0;
            const prefix = ctx.dataset.label ? `${ctx.dataset.label}: ` : '';
            return prefix + fmt(raw);
          },
        },
      },
    },
    scales: {
      [valueAxis]: {
        beginAtZero: true,
        ticks: { callback: (v) => fmt(Number(v)) },
        grid: { color: 'rgba(0,0,0,0.05)' },
      },
      [indexAxis]: { grid: { display: false } },
    },
  } as ChartOptions<'bar' | 'line'>;
}

// 1. Spending by category (donut)
const spendingData = computed<ChartData<'doughnut'>>(() => {
  const items = wallet.analytics?.spendingByCategory ?? [];
  return {
    labels: items.map((i) => i.name),
    datasets: [
      {
        data: items.map((i) => toMajor(i.totalMinor)),
        backgroundColor: items.map((i) => i.color),
        borderWidth: 0,
      },
    ],
  };
});
const spendingTotal = computed(() =>
  (wallet.analytics?.spendingByCategory ?? []).reduce((s, i) => s + i.totalMinor, 0)
);
const spendingOptions = computed<ChartOptions<'doughnut'>>(() => ({
  plugins: {
    legend: { position: 'bottom' },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const value = Number(ctx.parsed) || 0;
          const total = spendingTotal.value / 100;
          const pct = total > 0 ? Math.round((value / total) * 100) : 0;
          return `${ctx.label}: ${fmt(value)} (${pct}%)`;
        },
      },
    },
  },
}));

// 2. Income vs Expense per month (grouped bar)
const flowData = computed<ChartData<'bar'>>(() => {
  const months = wallet.analytics?.incomeExpenseByMonth ?? [];
  return {
    labels: months.map((m) => monthLabel(m.month)),
    datasets: [
      {
        label: 'Income',
        data: months.map((m) => toMajor(m.incomeMinor)),
        backgroundColor: LAVENDER,
        borderRadius: 6,
      },
      {
        label: 'Expense',
        data: months.map((m) => toMajor(m.expenseMinor)),
        backgroundColor: ROSE,
        borderRadius: 6,
      },
    ],
  };
});

// 3. Cash flow / net per month (bar coloured by sign)
const cashFlowData = computed<ChartData<'bar'>>(() => {
  const months = wallet.analytics?.incomeExpenseByMonth ?? [];
  return {
    labels: months.map((m) => monthLabel(m.month)),
    datasets: [
      {
        label: 'Net',
        data: months.map((m) => toMajor(m.netMinor)),
        backgroundColor: months.map((m) => (m.netMinor >= 0 ? SAGE : ERROR)),
        borderRadius: 6,
      },
    ],
  };
});

// 4. Account balance trend (line)
const balanceData = computed<ChartData<'line'>>(() => {
  const points = wallet.analytics?.balanceTrend ?? [];
  return {
    labels: points.map((p) => monthLabel(p.month)),
    datasets: [
      {
        label: 'Balance',
        data: points.map((p) => toMajor(p.balanceMinor)),
        borderColor: SAGE,
        backgroundColor: 'rgba(76,100,85,0.12)',
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointBackgroundColor: SAGE,
      },
    ],
  };
});

// 5. Budget vs actual (grouped bar)
const budgetData = computed<ChartData<'bar'>>(() => {
  const budgets = activeBudgets.value;
  return {
    labels: budgets.map((b) => b.name),
    datasets: [
      {
        label: 'Budget',
        data: budgets.map((b) => toMajor(b.amountMinor)),
        backgroundColor: 'rgba(76,100,85,0.35)',
        borderRadius: 6,
      },
      {
        label: 'Spent',
        data: budgets.map((b) => toMajor(b.spentMinor)),
        backgroundColor: budgets.map((b) => (b.remainingMinor < 0 ? ERROR : SAGE)),
        borderRadius: 6,
      },
    ],
  };
});

// 6. Top payees (horizontal bar)
const payeeData = computed<ChartData<'bar'>>(() => {
  const payees = wallet.analytics?.topPayees ?? [];
  return {
    labels: payees.map((p) => p.payee),
    datasets: [
      {
        label: 'Spent',
        data: payees.map((p) => toMajor(p.totalMinor)),
        backgroundColor: ROSE,
        borderRadius: 6,
      },
    ],
  };
});

const barOptions = computed(() => moneyScaleOptions('x'));
const horizontalBarOptions = computed(() => moneyScaleOptions('y'));
</script>

<template>
  <div class="flex flex-col gap-stack-md pb-stack-md">
    <p class="text-body-sm text-on-surface-variant">
      Showing {{ wallet.rangeLabel.toLowerCase() }}<template v-if="wallet.selectedAccount">
        · {{ wallet.selectedAccount.name }}</template>.
    </p>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-stack-md">
      <!-- Spending by category -->
      <section class="bg-surface-container rounded-xl p-stack-md flex flex-col gap-base">
        <h3 class="font-label-md text-label-md text-on-surface">Spending by category</h3>
        <div v-if="hasSpending" class="h-64">
          <DonutChart :data="spendingData" :options="spendingOptions" />
        </div>
        <p v-else class="text-body-sm text-on-surface-variant py-stack-md text-center">
          No spending in this period.
        </p>
      </section>

      <!-- Income vs expense -->
      <section class="bg-surface-container rounded-xl p-stack-md flex flex-col gap-base">
        <h3 class="font-label-md text-label-md text-on-surface">Income vs expense</h3>
        <div class="h-64">
          <BarChart :data="flowData" :options="barOptions" />
        </div>
      </section>

      <!-- Cash flow -->
      <section class="bg-surface-container rounded-xl p-stack-md flex flex-col gap-base">
        <h3 class="font-label-md text-label-md text-on-surface">Monthly cash flow</h3>
        <div class="h-64">
          <BarChart :data="cashFlowData" :options="barOptions" />
        </div>
      </section>

      <!-- Balance trend -->
      <section class="bg-surface-container rounded-xl p-stack-md flex flex-col gap-base">
        <h3 class="font-label-md text-label-md text-on-surface">Balance trend</h3>
        <div class="h-64">
          <LineChart :data="balanceData" :options="barOptions" />
        </div>
      </section>

      <!-- Budget vs actual -->
      <section class="bg-surface-container rounded-xl p-stack-md flex flex-col gap-base">
        <h3 class="font-label-md text-label-md text-on-surface">Budget vs actual</h3>
        <div v-if="activeBudgets.length" class="h-64">
          <BarChart :data="budgetData" :options="barOptions" />
        </div>
        <p v-else class="text-body-sm text-on-surface-variant py-stack-md text-center">
          No budgets to compare yet.
        </p>
      </section>

      <!-- Top payees -->
      <section class="bg-surface-container rounded-xl p-stack-md flex flex-col gap-base">
        <h3 class="font-label-md text-label-md text-on-surface">Top payees</h3>
        <div v-if="hasPayees" class="h-64">
          <BarChart :data="payeeData" :options="horizontalBarOptions" />
        </div>
        <p v-else class="text-body-sm text-on-surface-variant py-stack-md text-center">
          No payees recorded in this period.
        </p>
      </section>
    </div>
  </div>
</template>
