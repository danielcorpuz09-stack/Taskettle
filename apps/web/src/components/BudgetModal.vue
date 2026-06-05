<script setup lang="ts">
import { reactive, ref } from 'vue';
import BaseModal from './BaseModal.vue';
import { useWalletStore } from '@/stores/wallet';
import { useBoardStore } from '@/stores/board';
import { apiErrorMessage } from '@/lib/api';
import { toMinor } from '@/lib/money';
import type { BudgetPeriod } from '@/types';

const emit = defineEmits<{ (e: 'close'): void; (e: 'saved'): void }>();

const board = useBoardStore();
const wallet = useWalletStore();

const PERIODS: { value: BudgetPeriod; label: string }[] = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'WEEKLY', label: 'Weekly' },
];

const form = reactive({
  name: '',
  categoryId: '',
  amount: '',
  period: 'MONTHLY' as BudgetPeriod,
});
const error = ref('');
const saving = ref(false);

async function submit() {
  if (!form.name.trim() || !form.amount) return;
  const amountMinor = toMinor(form.amount);
  if (amountMinor <= 0) {
    error.value = 'Amount must be greater than zero';
    return;
  }
  error.value = '';
  saving.value = true;
  try {
    await wallet.createBudget(board.currentCircleId!, {
      name: form.name.trim(),
      categoryId: form.categoryId || null,
      amountMinor,
      period: form.period,
    });
    emit('saved');
  } catch (err) {
    error.value = apiErrorMessage(err, 'Could not create budget');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <BaseModal title="New Budget" @close="emit('close')">
    <form class="flex flex-col gap-stack-sm" @submit.prevent="submit">
      <p v-if="error" class="bg-error-container text-on-error-container rounded-lg px-stack-sm py-base text-body-md">
        {{ error }}
      </p>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="bg-name">Name *</label>
        <input
          id="bg-name"
          v-model="form.name"
          type="text"
          required
          placeholder="e.g. Monthly Groceries"
          class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
        />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-stack-sm">
        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="bg-amount">Limit *</label>
          <input
            id="bg-amount"
            v-model="form.amount"
            type="number"
            min="0"
            step="0.01"
            required
            placeholder="0.00"
            class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
          />
        </div>

        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="bg-period">Period</label>
          <select
            id="bg-period"
            v-model="form.period"
            class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
          >
            <option v-for="p in PERIODS" :key="p.value" :value="p.value">{{ p.label }}</option>
          </select>
        </div>
      </div>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="bg-category">Category</label>
        <select
          id="bg-category"
          v-model="form.categoryId"
          class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
        >
          <option value="">All expenses</option>
          <option v-for="c in wallet.expenseCategories" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>

      <div class="flex justify-end gap-stack-sm pt-base">
        <button type="button" class="px-stack-md py-stack-sm rounded-full text-label-md text-on-surface-variant hover:bg-surface-container transition-colors" @click="emit('close')">
          Cancel
        </button>
        <button
          type="submit"
          :disabled="saving"
          class="bg-primary text-on-primary px-stack-lg py-stack-sm rounded-full font-label-md hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
        >
          {{ saving ? 'Saving…' : 'Save' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>
