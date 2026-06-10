<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import BaseModal from './BaseModal.vue';
import { useWalletStore } from '@/stores/wallet';
import { useBoardStore } from '@/stores/board';
import { apiErrorMessage } from '@/lib/api';
import { toMinor } from '@/lib/money';
import { fromDateTimeLocal, toDateTimeLocal } from '@/lib/date';
import type { TransactionType } from '@/types';

const emit = defineEmits<{ (e: 'close'): void; (e: 'saved'): void }>();

const board = useBoardStore();
const wallet = useWalletStore();

const TYPES: { value: TransactionType; label: string }[] = [
  { value: 'EXPENSE', label: 'Expense' },
  { value: 'INCOME', label: 'Income' },
  { value: 'TRANSFER', label: 'Transfer' },
];

const form = reactive({
  accountId: wallet.activeAccounts[0]?.id ?? '',
  type: 'EXPENSE' as TransactionType,
  amount: '',
  categoryId: '',
  note: '',
  payee: '',
  transactionDate: toDateTimeLocal(new Date().toISOString()),
});
const error = ref('');
const saving = ref(false);

const categories = computed(() =>
  form.type === 'INCOME' ? wallet.incomeCategories : wallet.expenseCategories
);

async function submit() {
  if (!form.accountId || !form.amount) return;
  const amountMinor = toMinor(form.amount);
  if (amountMinor <= 0) {
    error.value = 'Amount must be greater than zero';
    return;
  }
  error.value = '';
  saving.value = true;
  try {
    await wallet.createTransaction(board.currentCircleId!, {
      accountId: form.accountId,
      type: form.type,
      amountMinor,
      categoryId: form.categoryId || null,
      note: form.note.trim() || null,
      payee: form.payee.trim() || null,
      transactionDate: fromDateTimeLocal(form.transactionDate) ?? undefined,
    });
    emit('saved');
  } catch (err) {
    error.value = apiErrorMessage(err, 'Could not save transaction');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <BaseModal title="Add Transaction" @close="emit('close')">
    <form class="flex flex-col gap-stack-sm" @submit.prevent="submit">
      <p v-if="error" class="bg-error-container text-on-error-container rounded-lg px-stack-sm py-base text-body-md">
        {{ error }}
      </p>

      <div class="flex gap-1 bg-surface-container rounded-full p-1">
        <button
          v-for="t in TYPES"
          :key="t.value"
          type="button"
          class="flex-1 py-1.5 rounded-full text-label-md transition-colors"
          :class="form.type === t.value ? 'bg-primary text-on-primary' : 'text-on-surface-variant'"
          @click="form.type = t.value"
        >
          {{ t.label }}
        </button>
      </div>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="tx-amount">Amount *</label>
        <input
          id="tx-amount"
          v-model="form.amount"
          type="number"
          min="0"
          step="0.01"
          required
          placeholder="0.00"
          class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
        />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-stack-sm">
        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="tx-account">Account *</label>
          <select
            id="tx-account"
            v-model="form.accountId"
            required
            class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
          >
            <option v-for="a in wallet.activeAccounts" :key="a.id" :value="a.id">{{ a.name }}</option>
          </select>
        </div>

        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="tx-category">Category</label>
          <select
            id="tx-category"
            v-model="form.categoryId"
            class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
          >
            <option value="">None</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
      </div>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="tx-payee">Payee</label>
        <input
          id="tx-payee"
          v-model="form.payee"
          type="text"
          placeholder="e.g. Corner Market"
          class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
        />
      </div>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="tx-date">Date</label>
        <input
          id="tx-date"
          v-model="form.transactionDate"
          type="datetime-local"
          class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
        />
      </div>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="tx-note">Note</label>
        <input
          id="tx-note"
          v-model="form.note"
          type="text"
          placeholder="Optional"
          class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
        />
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
