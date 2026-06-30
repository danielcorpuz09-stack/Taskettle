<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import BaseModal from './BaseModal.vue';
import { useWalletStore } from '@/stores/wallet';
import { useBoardStore } from '@/stores/board';
import { apiErrorMessage } from '@/lib/api';
import { formatMoney, toMinor } from '@/lib/money';
import type { SavingsGoal } from '@/types';

const props = defineProps<{ goal: SavingsGoal }>();
const emit = defineEmits<{ (e: 'close'): void; (e: 'saved'): void }>();

const board = useBoardStore();
const wallet = useWalletStore();

type Direction = 'DEPOSIT' | 'WITHDRAWAL';

const form = reactive({
  direction: 'DEPOSIT' as Direction,
  amount: '',
  accountId: '',
  note: '',
});
const error = ref('');
const saving = ref(false);

const isWithdraw = computed(() => form.direction === 'WITHDRAWAL');

async function submit() {
  if (!form.amount) return;
  const amountMinor = toMinor(form.amount);
  if (amountMinor <= 0) {
    error.value = 'Amount must be greater than zero';
    return;
  }
  if (isWithdraw.value && amountMinor > props.goal.savedMinor) {
    error.value = 'You can only withdraw what has been saved';
    return;
  }
  error.value = '';
  saving.value = true;
  try {
    await wallet.addContribution(board.currentCircleId!, props.goal.id, {
      amountMinor,
      direction: form.direction,
      accountId: form.accountId || null,
      note: form.note.trim() || null,
    });
    emit('saved');
  } catch (err) {
    error.value = apiErrorMessage(err, 'Could not record contribution');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <BaseModal :title="`Contribute to ${goal.name}`" @close="emit('close')">
    <form class="flex flex-col gap-stack-sm" @submit.prevent="submit">
      <p v-if="error" class="bg-error-container text-on-error-container rounded-lg px-stack-sm py-base text-body-md">
        {{ error }}
      </p>

      <p class="text-body-sm text-on-surface-variant">
        Saved so far:
        <span class="font-label-md text-on-surface">{{ formatMoney(goal.savedMinor, goal.currency) }}</span>
        of {{ formatMoney(goal.targetAmountMinor, goal.currency) }}
      </p>

      <!-- Direction toggle -->
      <div class="flex gap-1 bg-surface-container rounded-full p-1">
        <button
          type="button"
          class="flex-1 py-2 rounded-full text-label-md font-semibold transition-all"
          :class="!isWithdraw ? 'bg-primary text-on-primary' : 'text-on-surface-variant'"
          @click="form.direction = 'DEPOSIT'"
        >
          Deposit
        </button>
        <button
          type="button"
          class="flex-1 py-2 rounded-full text-label-md font-semibold transition-all"
          :class="isWithdraw ? 'bg-secondary text-on-secondary' : 'text-on-surface-variant'"
          @click="form.direction = 'WITHDRAWAL'"
        >
          Withdraw
        </button>
      </div>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="contrib-amount">Amount *</label>
        <input
          id="contrib-amount"
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
        <label class="font-label-md text-label-md text-on-surface" for="contrib-account">
          {{ isWithdraw ? 'Return money to' : 'Take money from' }}
        </label>
        <select
          id="contrib-account"
          v-model="form.accountId"
          class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
        >
          <option value="">Don't track in an account</option>
          <option v-for="a in wallet.activeAccounts" :key="a.id" :value="a.id">{{ a.name }}</option>
        </select>
      </div>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="contrib-note">Note</label>
        <input
          id="contrib-note"
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
