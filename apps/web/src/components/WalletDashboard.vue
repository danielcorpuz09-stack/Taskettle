<script setup lang="ts">
import { formatMoney } from '@/lib/money';
import type { WalletDashboard } from '@/types';

defineProps<{ dashboard: WalletDashboard }>();
</script>

<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-stack-sm">
    <div class="bg-surface-container rounded-xl p-stack-sm flex flex-col gap-1">
      <span class="text-label-sm text-on-surface-variant flex items-center gap-1">
        <span class="material-symbols-outlined !text-[18px] text-primary">savings</span>
        Balance
      </span>
      <span class="font-headline text-headline-sm text-on-surface">
        {{ formatMoney(dashboard.accountsBalanceMinor, dashboard.currency) }}
      </span>
    </div>

    <div class="bg-surface-container rounded-xl p-stack-sm flex flex-col gap-1">
      <span class="text-label-sm text-on-surface-variant flex items-center gap-1">
        <span class="material-symbols-outlined !text-[18px] text-tertiary">trending_up</span>
        Income (mo.)
      </span>
      <span class="font-headline text-headline-sm text-on-surface">
        {{ formatMoney(dashboard.incomeMinor, dashboard.currency) }}
      </span>
    </div>

    <div class="bg-surface-container rounded-xl p-stack-sm flex flex-col gap-1">
      <span class="text-label-sm text-on-surface-variant flex items-center gap-1">
        <span class="material-symbols-outlined !text-[18px] text-error">trending_down</span>
        Spent (mo.)
      </span>
      <span class="font-headline text-headline-sm text-on-surface">
        {{ formatMoney(dashboard.expenseMinor, dashboard.currency) }}
      </span>
    </div>

    <div class="bg-surface-container rounded-xl p-stack-sm flex flex-col gap-1">
      <span class="text-label-sm text-on-surface-variant flex items-center gap-1">
        <span class="material-symbols-outlined !text-[18px] text-secondary">handshake</span>
        Open debts
      </span>
      <span class="font-headline text-headline-sm text-on-surface">
        {{ dashboard.openDebtCount }}
        <span v-if="dashboard.overdueDebtCount" class="text-body-sm text-error font-normal">
          ({{ dashboard.overdueDebtCount }} overdue)
        </span>
      </span>
    </div>
  </div>

  <div class="grid grid-cols-2 gap-stack-sm mt-stack-sm">
    <div class="bg-tertiary-container/50 rounded-xl p-stack-sm flex flex-col gap-1">
      <span class="text-label-sm text-on-surface-variant">Owed to me</span>
      <span class="font-headline text-headline-sm text-on-surface">
        {{ formatMoney(dashboard.owedToMeMinor, dashboard.currency) }}
      </span>
    </div>
    <div class="bg-error-container/40 rounded-xl p-stack-sm flex flex-col gap-1">
      <span class="text-label-sm text-on-surface-variant">I owe</span>
      <span class="font-headline text-headline-sm text-on-surface">
        {{ formatMoney(dashboard.owedByMeMinor, dashboard.currency) }}
      </span>
    </div>
  </div>
</template>
