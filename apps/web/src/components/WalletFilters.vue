<script setup lang="ts">
import { ref } from 'vue';
import { useWalletStore, type RangePreset } from '@/stores/wallet';

const wallet = useWalletStore();
const emit = defineEmits<{ (e: 'changed'): void }>();

const presets: { id: RangePreset; label: string }[] = [
  { id: 'this-month', label: 'This month' },
  { id: 'last-month', label: 'Last month' },
  { id: 'last-3-months', label: 'Last 3 months' },
  { id: 'this-year', label: 'This year' },
  { id: 'custom', label: 'Custom' },
];

const toInputDate = (iso: string) => new Date(iso).toISOString().slice(0, 10);
const customFrom = ref(toInputDate(wallet.dateRange.from));
const customTo = ref(toInputDate(wallet.dateRange.to));
const showCustom = ref(wallet.dateRange.preset === 'custom');

function selectAccount(accountId: string) {
  wallet.setAccount(accountId);
  emit('changed');
}

function selectPreset(preset: RangePreset) {
  if (preset === 'custom') {
    showCustom.value = true;
    applyCustom();
    return;
  }
  showCustom.value = false;
  wallet.setRange(preset);
  emit('changed');
}

function applyCustom() {
  if (!customFrom.value || !customTo.value) return;
  const fromIso = new Date(`${customFrom.value}T00:00:00`).toISOString();
  // Make the end date inclusive: bump to the start of the following day.
  const toDate = new Date(`${customTo.value}T00:00:00`);
  toDate.setDate(toDate.getDate() + 1);
  wallet.setRange('custom', fromIso, toDate.toISOString());
  emit('changed');
}
</script>

<template>
  <div class="bg-surface-container rounded-xl p-stack-sm flex flex-col gap-stack-sm">
    <!-- Account selector -->
    <div class="flex items-center gap-2 overflow-x-auto pb-1">
      <button
        class="px-3 py-1.5 rounded-full text-label-sm whitespace-nowrap transition-colors"
        :class="wallet.selectedAccountId === ''
          ? 'bg-primary text-on-primary'
          : 'bg-surface text-on-surface-variant hover:text-on-surface'"
        @click="selectAccount('')"
      >
        All accounts
      </button>
      <button
        v-for="a in wallet.activeAccounts"
        :key="a.id"
        class="px-3 py-1.5 rounded-full text-label-sm whitespace-nowrap transition-colors flex items-center gap-1"
        :class="wallet.selectedAccountId === a.id
          ? 'bg-primary text-on-primary'
          : 'bg-surface text-on-surface-variant hover:text-on-surface'"
        @click="selectAccount(a.id)"
      >
        <span class="material-symbols-outlined !text-[16px]">account_balance_wallet</span>
        {{ a.name }}
      </button>
    </div>

    <!-- Period selector -->
    <div class="flex items-center gap-2 overflow-x-auto">
      <button
        v-for="p in presets"
        :key="p.id"
        class="px-3 py-1.5 rounded-full text-label-sm whitespace-nowrap transition-colors"
        :class="wallet.dateRange.preset === p.id
          ? 'bg-tertiary text-on-tertiary'
          : 'bg-surface text-on-surface-variant hover:text-on-surface'"
        @click="selectPreset(p.id)"
      >
        {{ p.label }}
      </button>
    </div>

    <!-- Custom range inputs -->
    <div v-if="showCustom" class="flex items-end gap-stack-sm flex-wrap">
      <label class="flex flex-col gap-1 text-label-sm text-on-surface-variant">
        From
        <input
          v-model="customFrom"
          type="date"
          class="bg-surface rounded-lg px-3 py-1.5 text-body-sm text-on-surface border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary"
          @change="applyCustom"
        />
      </label>
      <label class="flex flex-col gap-1 text-label-sm text-on-surface-variant">
        To
        <input
          v-model="customTo"
          type="date"
          class="bg-surface rounded-lg px-3 py-1.5 text-body-sm text-on-surface border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary"
          @change="applyCustom"
        />
      </label>
    </div>
  </div>
</template>
