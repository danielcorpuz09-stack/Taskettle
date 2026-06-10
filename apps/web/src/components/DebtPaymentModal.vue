<script setup lang="ts">
import { reactive, ref } from 'vue';
import BaseModal from './BaseModal.vue';
import { useWalletStore } from '@/stores/wallet';
import { apiErrorMessage } from '@/lib/api';
import { formatMoney, toMajor, toMinor } from '@/lib/money';
import type { Debt } from '@/types';

const props = defineProps<{ debt: Debt }>();
const emit = defineEmits<{ (e: 'close'): void; (e: 'saved'): void }>();

const wallet = useWalletStore();

const form = reactive({
  amount: String(toMajor(props.debt.remainingMinor)),
  accountId: '',
});
const error = ref('');
const saving = ref(false);

async function submit() {
  const amountMinor = toMinor(form.amount);
  if (amountMinor <= 0) {
    error.value = 'Amount must be greater than zero';
    return;
  }
  if (amountMinor > props.debt.remainingMinor) {
    error.value = 'Payment exceeds the remaining balance';
    return;
  }
  error.value = '';
  saving.value = true;
  try {
    await wallet.recordPayment(props.debt.id, {
      amountMinor,
      accountId: form.accountId || null,
    });
    emit('saved');
  } catch (err) {
    error.value = apiErrorMessage(err, 'Could not record payment');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <BaseModal title="Record Payment" @close="emit('close')">
    <form class="flex flex-col gap-stack-sm" @submit.prevent="submit">
      <p v-if="error" class="bg-error-container text-on-error-container rounded-lg px-stack-sm py-base text-body-md">
        {{ error }}
      </p>

      <p class="text-body-sm text-on-surface-variant">
        Remaining balance:
        <span class="font-label-md text-on-surface">{{ formatMoney(debt.remainingMinor, debt.currency) }}</span>
      </p>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="pay-amount">Amount *</label>
        <input
          id="pay-amount"
          v-model="form.amount"
          type="number"
          min="0"
          step="0.01"
          required
          class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
        />
      </div>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="pay-account">
          Record as transaction from
        </label>
        <select
          id="pay-account"
          v-model="form.accountId"
          class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
        >
          <option value="">Don't track in an account</option>
          <option v-for="a in wallet.activeAccounts" :key="a.id" :value="a.id">{{ a.name }}</option>
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
          {{ saving ? 'Saving…' : 'Record' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>
