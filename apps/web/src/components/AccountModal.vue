<script setup lang="ts">
import { reactive, ref } from 'vue';
import BaseModal from './BaseModal.vue';
import { useWalletStore } from '@/stores/wallet';
import { useBoardStore } from '@/stores/board';
import { apiErrorMessage } from '@/lib/api';
import type { WalletAccountType } from '@/types';

const emit = defineEmits<{ (e: 'close'): void; (e: 'saved'): void }>();

const board = useBoardStore();
const wallet = useWalletStore();

const TYPES: { value: WalletAccountType; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK', label: 'Bank' },
  { value: 'CARD', label: 'Card' },
  { value: 'SAVINGS', label: 'Savings' },
  { value: 'OTHER', label: 'Other' },
];

const form = reactive({
  name: '',
  type: 'CASH' as WalletAccountType,
  currency: 'USD',
});
const error = ref('');
const saving = ref(false);

async function submit() {
  if (!form.name.trim()) return;
  error.value = '';
  saving.value = true;
  try {
    await wallet.createAccount(board.currentCircleId!, {
      name: form.name.trim(),
      type: form.type,
      currency: form.currency.trim().toUpperCase() || 'USD',
    });
    emit('saved');
  } catch (err) {
    error.value = apiErrorMessage(err, 'Could not create account');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <BaseModal title="New Account" @close="emit('close')">
    <form class="flex flex-col gap-stack-sm" @submit.prevent="submit">
      <p v-if="error" class="bg-error-container text-on-error-container rounded-lg px-stack-sm py-base text-body-md">
        {{ error }}
      </p>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="acc-name">Name *</label>
        <input
          id="acc-name"
          v-model="form.name"
          type="text"
          required
          placeholder="e.g. Household Checking"
          class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
        />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-stack-sm">
        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="acc-type">Type</label>
          <select
            id="acc-type"
            v-model="form.type"
            class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
          >
            <option v-for="t in TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
          </select>
        </div>

        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="acc-currency">Currency</label>
          <input
            id="acc-currency"
            v-model="form.currency"
            type="text"
            maxlength="3"
            placeholder="USD"
            class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md uppercase"
          />
        </div>
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
