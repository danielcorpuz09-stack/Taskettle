<script setup lang="ts">
import { reactive, ref } from 'vue';
import BaseModal from './BaseModal.vue';
import { useWalletStore } from '@/stores/wallet';
import { useBoardStore } from '@/stores/board';
import { apiErrorMessage } from '@/lib/api';
import { toMinor } from '@/lib/money';

const emit = defineEmits<{ (e: 'close'): void; (e: 'saved'): void }>();

const board = useBoardStore();
const wallet = useWalletStore();

const ICONS = ['savings', 'home', 'directions_car', 'flight', 'school', 'devices', 'celebration', 'redeem'];

const form = reactive({
  name: '',
  amount: '',
  targetDate: '',
  icon: 'savings',
});
const error = ref('');
const saving = ref(false);

async function submit() {
  if (!form.name.trim() || !form.amount) return;
  const targetAmountMinor = toMinor(form.amount);
  if (targetAmountMinor <= 0) {
    error.value = 'Target amount must be greater than zero';
    return;
  }
  error.value = '';
  saving.value = true;
  try {
    await wallet.createGoal(board.currentCircleId!, {
      name: form.name.trim(),
      targetAmountMinor,
      targetDate: form.targetDate ? new Date(form.targetDate).toISOString() : null,
      icon: form.icon,
    });
    emit('saved');
  } catch (err) {
    error.value = apiErrorMessage(err, 'Could not create goal');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <BaseModal title="New Savings Goal" @close="emit('close')">
    <form class="flex flex-col gap-stack-sm" @submit.prevent="submit">
      <p v-if="error" class="bg-error-container text-on-error-container rounded-lg px-stack-sm py-base text-body-md">
        {{ error }}
      </p>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="goal-name">What are you saving for? *</label>
        <input
          id="goal-name"
          v-model="form.name"
          type="text"
          required
          placeholder="e.g. Dream house, New equipment"
          class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
        />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-stack-sm">
        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="goal-amount">Target amount *</label>
          <input
            id="goal-amount"
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
          <label class="font-label-md text-label-md text-on-surface" for="goal-date">Target date</label>
          <input
            id="goal-date"
            v-model="form.targetDate"
            type="date"
            class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
          />
        </div>
      </div>

      <div class="flex flex-col gap-base">
        <span class="font-label-md text-label-md text-on-surface">Icon</span>
        <div class="flex flex-wrap gap-base">
          <button
            v-for="ic in ICONS"
            :key="ic"
            type="button"
            class="w-11 h-11 rounded-full flex items-center justify-center transition-all"
            :class="form.icon === ic ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'"
            :aria-label="ic"
            @click="form.icon = ic"
          >
            <span class="material-symbols-outlined !text-[22px]">{{ ic }}</span>
          </button>
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
