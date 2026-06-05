<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import BaseModal from './BaseModal.vue';
import { useWalletStore } from '@/stores/wallet';
import { useBoardStore } from '@/stores/board';
import { useAuthStore } from '@/stores/auth';
import { apiErrorMessage } from '@/lib/api';
import { toMinor } from '@/lib/money';
import { fromDateTimeLocal } from '@/lib/date';

const emit = defineEmits<{ (e: 'close'): void; (e: 'saved'): void }>();

const board = useBoardStore();
const wallet = useWalletStore();
const auth = useAuthStore();

const form = reactive({
  direction: 'owedToMe' as 'owedToMe' | 'iOwe',
  otherPartyId: '',
  amount: '',
  reason: '',
  dueDate: '',
});
const error = ref('');
const saving = ref(false);

const otherMembers = computed(() =>
  board.members.filter((m) => m.userId !== auth.user?.id)
);

async function submit() {
  if (!form.otherPartyId || !form.amount) return;
  const amountMinor = toMinor(form.amount);
  if (amountMinor <= 0) {
    error.value = 'Amount must be greater than zero';
    return;
  }
  const me = auth.user!.id;
  const lenderId = form.direction === 'owedToMe' ? me : form.otherPartyId;
  const borrowerId = form.direction === 'owedToMe' ? form.otherPartyId : me;
  error.value = '';
  saving.value = true;
  try {
    await wallet.createDebt(board.currentCircleId!, {
      lenderId,
      borrowerId,
      amountMinor,
      reason: form.reason.trim() || null,
      dueDate: form.dueDate ? fromDateTimeLocal(form.dueDate) : null,
    });
    emit('saved');
  } catch (err) {
    error.value = apiErrorMessage(err, 'Could not create debt');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <BaseModal title="New Debt" @close="emit('close')">
    <form class="flex flex-col gap-stack-sm" @submit.prevent="submit">
      <p v-if="error" class="bg-error-container text-on-error-container rounded-lg px-stack-sm py-base text-body-md">
        {{ error }}
      </p>

      <div class="flex gap-1 bg-surface-container rounded-full p-1">
        <button
          type="button"
          class="flex-1 py-1.5 rounded-full text-label-md transition-colors"
          :class="form.direction === 'owedToMe' ? 'bg-primary text-on-primary' : 'text-on-surface-variant'"
          @click="form.direction = 'owedToMe'"
        >
          Owed to me
        </button>
        <button
          type="button"
          class="flex-1 py-1.5 rounded-full text-label-md transition-colors"
          :class="form.direction === 'iOwe' ? 'bg-primary text-on-primary' : 'text-on-surface-variant'"
          @click="form.direction = 'iOwe'"
        >
          I owe
        </button>
      </div>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="debt-party">
          {{ form.direction === 'owedToMe' ? 'Who owes me *' : 'Who I owe *' }}
        </label>
        <select
          id="debt-party"
          v-model="form.otherPartyId"
          required
          class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
        >
          <option value="" disabled>Select a member</option>
          <option v-for="m in otherMembers" :key="m.userId" :value="m.userId">{{ m.name }}</option>
        </select>
      </div>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="debt-amount">Amount *</label>
        <input
          id="debt-amount"
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
        <label class="font-label-md text-label-md text-on-surface" for="debt-reason">Reason</label>
        <input
          id="debt-reason"
          v-model="form.reason"
          type="text"
          placeholder="e.g. Concert ticket"
          class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
        />
      </div>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="debt-due">Due date</label>
        <input
          id="debt-due"
          v-model="form.dueDate"
          type="datetime-local"
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
