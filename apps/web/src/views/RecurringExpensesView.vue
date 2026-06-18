<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useBoardStore } from '@/stores/board';
import { useRecurringExpensesStore } from '@/stores/recurring-expenses';
import { apiErrorMessage } from '@/lib/api';
import CreateRecurringExpenseModal from '@/components/CreateRecurringExpenseModal.vue';
import type { RecurringExpense } from '@/types';

const router = useRouter();
const board = useBoardStore();
const expenses = useRecurringExpensesStore();

const error = ref('');
const showCreate = ref(false);
const editingExpense = ref<RecurringExpense | null>(null);

onMounted(async () => {
  try {
    if (board.currentCircleId) {
      await expenses.fetchExpenses(board.currentCircleId);
    }
  } catch (err) {
    error.value = apiErrorMessage(err);
  }
});

function goBack() {
  router.push({ name: 'board' });
}

function formatAmount(minorAmount: number): string {
  return (minorAmount / 100).toFixed(2);
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- Header -->
    <header class="bg-surface fixed top-0 w-full z-40 border-b border-surface-container">
      <nav class="flex justify-between items-center w-full px-container-padding-mobile sm:px-container-padding-desktop py-stack-sm max-w-[1440px] mx-auto gap-base">
        <div class="flex items-center gap-stack-sm">
          <button
            class="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container transition-colors"
            @click="goBack"
          >
            <span class="material-symbols-outlined text-on-surface">arrow_back</span>
          </button>
          <span class="font-headline-xl text-headline-md sm:text-headline-xl text-primary">Recurring Expenses</span>
        </div>

        <div class="flex items-center gap-base">
          <button
            class="bg-primary text-on-primary px-stack-sm sm:px-stack-md py-2 rounded-full font-label-md flex items-center gap-base hover:opacity-90 active:scale-95 transition-all"
            @click="showCreate = true"
          >
            <span class="material-symbols-outlined !text-[20px]">add</span>
            <span class="hidden sm:inline">Add Expense</span>
          </button>
        </div>
      </nav>
    </header>

    <main class="flex-1 pt-[72px] px-container-padding-mobile sm:px-container-padding-desktop py-stack-sm max-w-[1440px] mx-auto w-full">
      <p v-if="error" class="mb-stack-sm bg-error-container text-on-error-container rounded-lg px-stack-sm py-base text-body-md">
        {{ error }}
      </p>

      <!-- Monthly total -->
      <div v-if="expenses.expenses.length > 0" class="bg-primary-container rounded-lg p-stack-sm mb-stack-sm">
        <p class="text-on-primary-container text-label-sm">Monthly Average</p>
        <p class="text-on-primary-container text-headline-md font-semibold">
          ${{ (expenses.totalMonthlyExpense / 100).toFixed(2) }}
        </p>
      </div>

      <div v-if="expenses.loading" class="flex items-center justify-center py-stack-lg">
        <span class="text-on-surface-variant">Loading expenses...</span>
      </div>

      <div v-else-if="expenses.expenses.length === 0" class="text-center py-stack-lg">
        <p class="text-on-surface-variant text-body-md">No recurring expenses yet.</p>
      </div>

      <div v-else class="space-y-base">
        <div
          v-for="expense in expenses.expenses"
          :key="expense.id"
          class="bg-surface-container rounded-lg p-stack-sm border border-surface-container hover:border-primary transition-colors cursor-pointer"
          @click="editingExpense = expense"
        >
          <div class="flex justify-between items-start gap-base">
            <div>
              <h3 class="font-label-lg text-on-surface">{{ expense.name }}</h3>
              <p class="text-label-sm text-on-surface-variant">{{ expense.category }} · {{ expense.frequency }}</p>
              <p v-if="expense.dueDate" class="text-body-sm text-on-surface-variant">Due on day {{ expense.dueDate }}</p>
            </div>
            <div class="text-right">
              <p class="font-label-lg text-on-surface">${{ formatAmount(expense.amountMinor) }}</p>
              <p v-if="expense.nextDue" class="text-label-sm text-on-surface-variant">
                Next: {{ new Date(expense.nextDue).toLocaleDateString() }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>

    <CreateRecurringExpenseModal
      v-if="showCreate || editingExpense"
      :expense="editingExpense"
      @close="
        showCreate = false;
        editingExpense = null;
      "
    />
  </div>
</template>
