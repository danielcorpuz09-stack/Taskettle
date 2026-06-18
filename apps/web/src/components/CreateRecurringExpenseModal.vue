<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import BaseModal from './BaseModal.vue';
import { useRecurringExpensesStore } from '@/stores/recurring-expenses';
import { useBoardStore } from '@/stores/board';
import { apiErrorMessage } from '@/lib/api';
import type { RecurringExpense, RecurringExpenseCategory, RecurringExpenseFrequency } from '@/types';

const props = defineProps<{
  expense?: RecurringExpense | null;
}>();
const emit = defineEmits<{ (e: 'close'): void }>();

const board = useBoardStore();
const expenses = useRecurringExpensesStore();

const CATEGORIES: RecurringExpenseCategory[] = ['UTILITY', 'SUBSCRIPTION'];
const FREQUENCIES: RecurringExpenseFrequency[] = ['MONTHLY', 'QUARTERLY', 'ANNUAL'];

const form = reactive({
  name: '',
  category: 'UTILITY' as RecurringExpenseCategory,
  amountMinor: '',
  currency: 'USD',
  dueDate: '',
  frequency: 'MONTHLY' as RecurringExpenseFrequency,
  autoPay: false,
  notes: '',
});

const error = ref('');
const saving = ref(false);
const deleting = ref(false);
const isEditing = computed(() => !!props.expense);

// Reset form when expense prop changes
watch(
  () => props.expense,
  (expense) => {
    if (expense) {
      form.name = expense.name;
      form.category = expense.category;
      form.amountMinor = String(expense.amountMinor);
      form.currency = expense.currency;
      form.dueDate = expense.dueDate ? String(expense.dueDate) : '';
      form.frequency = expense.frequency;
      form.autoPay = expense.autoPay;
      form.notes = expense.notes ?? '';
    } else {
      form.name = '';
      form.category = 'UTILITY';
      form.amountMinor = '';
      form.currency = 'USD';
      form.dueDate = '';
      form.frequency = 'MONTHLY';
      form.autoPay = false;
      form.notes = '';
    }
  },
  { immediate: true }
);

async function save() {
  if (!form.name.trim()) {
    error.value = 'Expense name is required';
    return;
  }
  if (!form.amountMinor || Number(form.amountMinor) <= 0) {
    error.value = 'Amount must be greater than 0';
    return;
  }

  error.value = '';
  saving.value = true;
  try {
    const payload = {
      name: form.name.trim(),
      category: form.category,
      amountMinor: Math.round(Number(form.amountMinor) * 100),
      currency: form.currency,
      dueDate: form.dueDate ? Number(form.dueDate) : undefined,
      frequency: form.frequency,
      autoPay: form.autoPay,
      notes: form.notes || undefined,
    };

    if (isEditing.value && props.expense) {
      await expenses.updateExpense(props.expense.id, payload);
    } else {
      if (!board.currentCircleId) return;
      await expenses.createExpense(board.currentCircleId, payload);
    }
    emit('close');
  } catch (err) {
    error.value = apiErrorMessage(err, isEditing.value ? 'Could not save changes' : 'Could not create expense');
  } finally {
    saving.value = false;
  }
}

async function remove() {
  if (!props.expense) return;
  if (!confirm('Delete this expense? This cannot be undone.')) return;

  deleting.value = true;
  try {
    await expenses.deleteExpense(props.expense.id);
    emit('close');
  } catch (err) {
    error.value = apiErrorMessage(err, 'Could not delete expense');
  } finally {
    deleting.value = false;
  }
}
</script>

<template>
  <BaseModal :title="isEditing ? 'Edit expense' : 'New recurring expense'" @close="emit('close')">
    <form class="flex flex-col gap-stack-sm" @submit.prevent="save">
      <p v-if="error" class="bg-error-container text-on-error-container rounded-lg px-stack-sm py-base text-body-md">
        {{ error }}
      </p>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="expense-name">Name</label>
        <input
          id="expense-name"
          v-model="form.name"
          type="text"
          required
          placeholder="e.g., Netflix Subscription"
          class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
        />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-stack-sm">
        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="expense-category">Category</label>
          <select
            id="expense-category"
            v-model="form.category"
            class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
          >
            <option v-for="cat in CATEGORIES" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>

        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="expense-frequency">Frequency</label>
          <select
            id="expense-frequency"
            v-model="form.frequency"
            class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
          >
            <option v-for="freq in FREQUENCIES" :key="freq" :value="freq">{{ freq }}</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-stack-sm">
        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="expense-amount">Amount</label>
          <input
            id="expense-amount"
            v-model="form.amountMinor"
            type="number"
            step="0.01"
            required
            placeholder="0.00"
            class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
          />
        </div>

        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="expense-due">Due Date of Month</label>
          <input
            id="expense-due"
            v-model="form.dueDate"
            type="number"
            min="1"
            max="31"
            placeholder="e.g., 1-31"
            class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
          />
        </div>
      </div>

      <div class="flex items-center gap-base">
        <input id="expense-autopay" v-model="form.autoPay" type="checkbox" class="w-4 h-4 rounded" />
        <label class="font-label-md text-label-md text-on-surface cursor-pointer" for="expense-autopay">
          Auto-pay enabled
        </label>
      </div>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="expense-notes">Notes</label>
        <textarea
          id="expense-notes"
          v-model="form.notes"
          rows="3"
          placeholder="Any helpful details…"
          class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md resize-none"
        ></textarea>
      </div>

      <div class="flex items-center justify-between gap-stack-sm mt-base">
        <button
          v-if="isEditing"
          type="button"
          :disabled="deleting"
          class="text-error font-label-md flex items-center gap-1 hover:bg-error-container/40 px-3 py-2 rounded-full transition-colors disabled:opacity-60"
          @click="remove"
        >
          <span class="material-symbols-outlined !text-[18px]">delete</span>
          Delete
        </button>
        <button
          type="submit"
          :disabled="saving"
          class="py-stack-sm px-stack-lg rounded-full bg-primary text-on-primary font-label-md shadow-md hover:bg-primary-container hover:text-on-primary-container active:scale-95 transition-all disabled:opacity-60 ml-auto"
        >
          {{ saving ? 'Saving…' : 'Save' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>
