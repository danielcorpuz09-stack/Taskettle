<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useBoardStore } from '@/stores/board';
import { useWalletStore } from '@/stores/wallet';
import { apiErrorMessage } from '@/lib/api';
import { formatMoney } from '@/lib/money';
import { formatDueLabel } from '@/lib/date';
import WalletDashboard from '@/components/WalletDashboard.vue';
import WalletFilters from '@/components/WalletFilters.vue';
import InsightsPanel from '@/components/InsightsPanel.vue';
import TransactionModal from '@/components/TransactionModal.vue';
import BudgetModal from '@/components/BudgetModal.vue';
import DebtModal from '@/components/DebtModal.vue';
import DebtPaymentModal from '@/components/DebtPaymentModal.vue';
import AccountModal from '@/components/AccountModal.vue';
import CreateGoalModal from '@/components/CreateGoalModal.vue';
import GoalContributionModal from '@/components/GoalContributionModal.vue';
import type { Debt, SavingsGoal } from '@/types';

const router = useRouter();
const auth = useAuthStore();
const board = useBoardStore();
const wallet = useWalletStore();

const error = ref('');
const showTransaction = ref(false);
const showBudget = ref(false);
const showDebt = ref(false);
const showAccount = ref(false);
const showGoal = ref(false);
const payingDebt = ref<Debt | null>(null);
const contributingGoal = ref<SavingsGoal | null>(null);

type TabId = 'overview' | 'insights' | 'transactions' | 'budgets' | 'debts' | 'goals' | 'accounts';
const activeTab = ref<TabId>('overview');

const hasCircle = computed(() => Boolean(board.currentCircleId));
const myId = computed(() => auth.user?.id ?? '');

const debtsOwedToMe = computed(() =>
  wallet.debts.filter((d) => d.lenderId === myId.value && d.status !== 'CANCELLED')
);
const debtsOwedByMe = computed(() =>
  wallet.debts.filter((d) => d.borrowerId === myId.value && d.status !== 'CANCELLED')
);

function memberName(userId: string): string {
  return board.members.find((m) => m.userId === userId)?.name ?? 'Someone';
}

function accountName(accountId: string): string {
  return wallet.accounts.find((a) => a.id === accountId)?.name ?? '—';
}

function categoryName(categoryId: string | null): string {
  if (!categoryId) return 'Uncategorized';
  return wallet.categories.find((c) => c.id === categoryId)?.name ?? 'Uncategorized';
}

const primaryAction = computed(() => {
  switch (activeTab.value) {
    case 'budgets':
      return { label: 'New Budget', action: () => (showBudget.value = true) };
    case 'debts':
      return { label: 'New Debt', action: () => (showDebt.value = true) };
    case 'goals':
      return { label: 'New Goal', action: () => (showGoal.value = true) };
    case 'accounts':
      return { label: 'New Account', action: () => (showAccount.value = true) };
    default:
      return { label: 'Add Transaction', action: () => (showTransaction.value = true) };
  }
});

watch(
  () => board.currentCircleId,
  async (id) => {
    if (id) await loadData(id);
  }
);

async function loadData(circleId: string) {
  try {
    await Promise.all([
      wallet.fetchDashboard(circleId),
      wallet.fetchAccounts(circleId),
      wallet.fetchCategories(circleId),
      wallet.fetchTransactions(circleId),
      wallet.fetchBudgets(circleId),
      wallet.fetchDebts(circleId),
      wallet.fetchGoals(circleId),
      wallet.fetchAnalytics(circleId),
      board.loadBoard(),
    ]);
  } catch (err) {
    error.value = apiErrorMessage(err);
  }
}

async function onFiltersChanged() {
  const id = board.currentCircleId;
  if (!id) return;
  try {
    await Promise.all([
      wallet.fetchDashboard(id),
      wallet.fetchTransactions(id),
      wallet.fetchBudgets(id),
      wallet.fetchAnalytics(id),
    ]);
  } catch (err) {
    error.value = apiErrorMessage(err);
  }
}

onMounted(async () => {
  try {
    if (!board.circles.length) {
      await Promise.all([auth.fetchMe(), board.fetchCircles()]);
    }
    if (board.currentCircleId) await loadData(board.currentCircleId);
  } catch (err) {
    error.value = apiErrorMessage(err);
  }
});

async function refresh() {
  showTransaction.value = false;
  showBudget.value = false;
  showDebt.value = false;
  showAccount.value = false;
  showGoal.value = false;
  payingDebt.value = null;
  contributingGoal.value = null;
  if (board.currentCircleId) await loadData(board.currentCircleId);
}

function budgetPercent(spent: number, amount: number): number {
  if (amount <= 0) return 0;
  return Math.min(Math.round((spent / amount) * 100), 100);
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-surface">
    <header class="bg-surface fixed top-0 w-full z-40 border-b border-surface-container">
      <nav class="flex justify-between items-center w-full px-container-padding-mobile sm:px-container-padding-desktop py-stack-sm max-w-[1440px] mx-auto gap-base">
        <div class="flex items-center gap-stack-sm">
          <button
            class="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container transition-colors"
            @click="router.push({ name: 'board' })"
          >
            <span class="material-symbols-outlined text-on-surface-variant">arrow_back</span>
          </button>
          <span class="font-headline-xl text-headline-md sm:text-headline-xl text-primary">Taskettle</span>
        </div>
        <button
          v-if="hasCircle"
          class="bg-primary text-on-primary px-stack-sm sm:px-stack-md py-2 rounded-full font-label-md flex items-center gap-base hover:opacity-90 active:scale-95 transition-all"
          @click="primaryAction.action()"
        >
          <span class="material-symbols-outlined !text-[20px]">add</span>
          <span class="hidden sm:inline">{{ primaryAction.label }}</span>
        </button>
      </nav>
    </header>

    <main class="flex-1 pt-[72px] px-container-padding-mobile sm:px-container-padding-desktop max-w-[1120px] mx-auto w-full">
      <p v-if="error" class="mt-stack-sm bg-error-container text-on-error-container rounded-lg px-stack-sm py-base text-body-md">
        {{ error }}
      </p>

      <div v-if="!hasCircle" class="flex-1 flex flex-col items-center justify-center text-center gap-stack-sm py-stack-lg">
        <div class="w-20 h-20 bg-primary-container rounded-xl flex items-center justify-center">
          <span class="material-symbols-outlined text-on-primary-container !text-[44px]">account_balance_wallet</span>
        </div>
        <h2 class="font-headline-lg text-headline-lg text-on-surface">No Circle Selected</h2>
        <p class="text-body-md text-on-surface-variant max-w-[360px]">
          Go back to the board and select or create a Circle first.
        </p>
        <button
          class="mt-base bg-primary text-on-primary px-stack-lg py-stack-sm rounded-full font-label-md shadow-md hover:bg-primary-container hover:text-on-primary-container active:scale-95 transition-all"
          @click="router.push({ name: 'board' })"
        >
          Go to Board
        </button>
      </div>

      <template v-else>
        <div class="flex items-center justify-between py-stack-sm flex-wrap gap-base">
          <h1 class="font-headline-lg text-headline-md sm:text-headline-lg text-on-surface flex items-center gap-2">
            <span class="material-symbols-outlined !text-[28px] text-primary">account_balance_wallet</span>
            Family Wallet
          </h1>
        </div>

        <WalletFilters class="mb-stack-sm" @changed="onFiltersChanged" />

        <!-- Tabs -->
        <div class="flex gap-1 border-b border-surface-container mb-stack-sm overflow-x-auto">
          <button
            v-for="tab in (['overview', 'insights', 'transactions', 'budgets', 'debts', 'goals', 'accounts'] as TabId[])"
            :key="tab"
            class="px-4 py-2.5 text-label-md font-semibold transition-colors relative capitalize whitespace-nowrap"
            :class="activeTab === tab ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'"
            @click="activeTab = tab"
          >
            {{ tab }}
            <span v-if="activeTab === tab" class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          </button>
        </div>

        <!-- Overview -->
        <template v-if="activeTab === 'overview'">
          <p class="text-body-sm text-on-surface-variant mb-base">
            Income &amp; spending for {{ wallet.rangeLabel.toLowerCase() }}<template v-if="wallet.selectedAccount"> · {{ wallet.selectedAccount.name }}</template>.
          </p>
          <WalletDashboard v-if="wallet.dashboard" :dashboard="wallet.dashboard" />

          <h2 class="font-label-lg text-label-lg text-on-surface mt-stack-md mb-base">Budgets this period</h2>
          <div v-if="wallet.budgets.length === 0" class="text-body-sm text-on-surface-variant">No budgets yet.</div>
          <div v-else class="flex flex-col gap-stack-sm">
            <div v-for="b in wallet.budgets.filter((x) => !x.archived)" :key="b.id" class="bg-surface-container rounded-xl p-stack-sm">
              <div class="flex items-center justify-between text-body-md text-on-surface">
                <span class="font-label-md">{{ b.name }}</span>
                <span>{{ formatMoney(b.spentMinor, b.currency) }} / {{ formatMoney(b.amountMinor, b.currency) }}</span>
              </div>
              <div class="mt-base h-2 rounded-full bg-surface-container-high overflow-hidden">
                <div
                  class="h-full rounded-full transition-all"
                  :class="b.remainingMinor < 0 ? 'bg-error' : 'bg-primary'"
                  :style="{ width: budgetPercent(b.spentMinor, b.amountMinor) + '%' }"
                />
              </div>
            </div>
          </div>
        </template>

        <!-- Insights -->
        <template v-if="activeTab === 'insights'">
          <InsightsPanel v-if="wallet.analytics" />
          <div v-else class="flex items-center justify-center py-stack-lg">
            <span class="material-symbols-outlined animate-spin !text-[32px] text-on-surface-variant">progress_activity</span>
          </div>
        </template>

        <!-- Transactions -->
        <template v-if="activeTab === 'transactions'">
          <div v-if="wallet.loading" class="flex items-center justify-center py-stack-lg">
            <span class="material-symbols-outlined animate-spin !text-[32px] text-on-surface-variant">progress_activity</span>
          </div>
          <div v-else-if="wallet.transactions.length === 0" class="flex flex-col items-center justify-center text-center gap-stack-sm py-stack-lg">
            <span class="material-symbols-outlined !text-[48px] text-on-surface-variant">receipt_long</span>
            <p class="text-body-md text-on-surface-variant">No transactions yet.</p>
          </div>
          <div v-else class="flex flex-col gap-1 pb-stack-md">
            <div
              v-for="t in wallet.transactions"
              :key="t.id"
              class="flex items-center justify-between bg-surface-container rounded-xl px-stack-sm py-stack-sm"
            >
              <div class="flex flex-col">
                <span class="text-body-md text-on-surface">{{ t.payee || t.note || categoryName(t.categoryId) }}</span>
                <span class="text-body-sm text-on-surface-variant">
                  {{ accountName(t.accountId) }} · {{ new Date(t.transactionDate).toLocaleDateString() }}
                </span>
              </div>
              <span
                class="font-label-md text-label-md"
                :class="t.type === 'INCOME' ? 'text-tertiary' : 'text-on-surface'"
              >
                {{ t.type === 'INCOME' ? '+' : '−' }}{{ formatMoney(t.amountMinor, t.currency) }}
              </span>
            </div>
          </div>
        </template>

        <!-- Budgets -->
        <template v-if="activeTab === 'budgets'">
          <div v-if="wallet.budgets.length === 0" class="flex flex-col items-center justify-center text-center gap-stack-sm py-stack-lg">
            <span class="material-symbols-outlined !text-[48px] text-on-surface-variant">savings</span>
            <p class="text-body-md text-on-surface-variant">No budgets yet. Create your first one!</p>
          </div>
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-stack-sm pb-stack-md">
            <div v-for="b in wallet.budgets" :key="b.id" class="bg-surface-container rounded-xl p-stack-md flex flex-col gap-base">
              <div class="flex items-center justify-between">
                <span class="font-label-md text-label-md text-on-surface">{{ b.name }}</span>
                <button
                  class="text-on-surface-variant hover:text-error transition-colors"
                  aria-label="Delete budget"
                  @click="wallet.deleteBudget(b.id)"
                >
                  <span class="material-symbols-outlined !text-[18px]">delete</span>
                </button>
              </div>
              <span class="text-body-sm text-on-surface-variant">{{ categoryName(b.categoryId) }} · {{ b.period.toLowerCase() }}</span>
              <div class="h-2 rounded-full bg-surface-container-high overflow-hidden">
                <div
                  class="h-full rounded-full transition-all"
                  :class="b.remainingMinor < 0 ? 'bg-error' : 'bg-primary'"
                  :style="{ width: budgetPercent(b.spentMinor, b.amountMinor) + '%' }"
                />
              </div>
              <div class="flex items-center justify-between text-body-sm">
                <span class="text-on-surface-variant">{{ formatMoney(b.spentMinor, b.currency) }} spent</span>
                <span :class="b.remainingMinor < 0 ? 'text-error' : 'text-on-surface'">
                  {{ formatMoney(b.remainingMinor, b.currency) }} left
                </span>
              </div>
            </div>
          </div>
        </template>

        <!-- Debts -->
        <template v-if="activeTab === 'debts'">
          <div v-if="wallet.debts.length === 0" class="flex flex-col items-center justify-center text-center gap-stack-sm py-stack-lg">
            <span class="material-symbols-outlined !text-[48px] text-on-surface-variant">handshake</span>
            <p class="text-body-md text-on-surface-variant">No debts tracked. Only you and the other person can see a debt.</p>
          </div>
          <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-stack-md pb-stack-md">
            <section>
              <h2 class="font-label-lg text-label-lg text-on-surface mb-base">Owed to me</h2>
              <div v-if="debtsOwedToMe.length === 0" class="text-body-sm text-on-surface-variant">Nothing owed to you.</div>
              <div v-else class="flex flex-col gap-stack-sm">
                <div v-for="d in debtsOwedToMe" :key="d.id" class="bg-tertiary-container/40 rounded-xl p-stack-sm flex flex-col gap-base">
                  <div class="flex items-center justify-between">
                    <span class="font-label-md text-on-surface">{{ memberName(d.borrowerId) }}</span>
                    <span class="font-label-md text-on-surface">{{ formatMoney(d.remainingMinor, d.currency) }}</span>
                  </div>
                  <span class="text-body-sm text-on-surface-variant">{{ d.reason || 'No reason given' }}</span>
                  <span v-if="d.dueDate" class="text-body-sm" :class="new Date(d.dueDate) < new Date() ? 'text-error' : 'text-on-surface-variant'">
                    {{ formatDueLabel(d.dueDate) }}
                  </span>
                  <div v-if="d.status !== 'PAID'" class="flex justify-end">
                    <button class="text-label-md text-primary hover:underline" @click="payingDebt = d">Record payment</button>
                  </div>
                  <span v-else class="text-label-md text-tertiary self-end">Settled</span>
                </div>
              </div>
            </section>

            <section>
              <h2 class="font-label-lg text-label-lg text-on-surface mb-base">I owe</h2>
              <div v-if="debtsOwedByMe.length === 0" class="text-body-sm text-on-surface-variant">You don't owe anyone.</div>
              <div v-else class="flex flex-col gap-stack-sm">
                <div v-for="d in debtsOwedByMe" :key="d.id" class="bg-error-container/30 rounded-xl p-stack-sm flex flex-col gap-base">
                  <div class="flex items-center justify-between">
                    <span class="font-label-md text-on-surface">{{ memberName(d.lenderId) }}</span>
                    <span class="font-label-md text-on-surface">{{ formatMoney(d.remainingMinor, d.currency) }}</span>
                  </div>
                  <span class="text-body-sm text-on-surface-variant">{{ d.reason || 'No reason given' }}</span>
                  <span v-if="d.dueDate" class="text-body-sm" :class="new Date(d.dueDate) < new Date() ? 'text-error' : 'text-on-surface-variant'">
                    {{ formatDueLabel(d.dueDate) }}
                  </span>
                  <div v-if="d.status !== 'PAID'" class="flex justify-end">
                    <button class="text-label-md text-primary hover:underline" @click="payingDebt = d">Record payment</button>
                  </div>
                  <span v-else class="text-label-md text-tertiary self-end">Settled</span>
                </div>
              </div>
            </section>
          </div>
        </template>

        <!-- Goals -->
        <template v-if="activeTab === 'goals'">
          <div v-if="wallet.goals.length === 0" class="flex flex-col items-center justify-center text-center gap-stack-sm py-stack-lg">
            <span class="material-symbols-outlined !text-[48px] text-on-surface-variant">savings</span>
            <p class="text-body-md text-on-surface-variant">No savings goals yet. Start saving for something special!</p>
          </div>
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-stack-sm pb-stack-md">
            <div v-for="g in wallet.goals" :key="g.id" class="bg-surface-container rounded-xl p-stack-md flex flex-col gap-base">
              <div class="flex items-start justify-between gap-base">
                <div class="flex items-center gap-base min-w-0">
                  <span class="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined !text-[22px]">{{ g.icon }}</span>
                  </span>
                  <div class="flex flex-col min-w-0">
                    <span class="font-label-md text-label-md text-on-surface truncate">{{ g.name }}</span>
                    <span
                      v-if="g.status === 'ACHIEVED'"
                      class="text-label-sm text-tertiary font-semibold flex items-center gap-1"
                    >
                      <span class="material-symbols-outlined !text-[16px]">verified</span>Achieved
                    </span>
                    <span v-else-if="g.targetDate" class="text-body-sm text-on-surface-variant">
                      {{ formatDueLabel(g.targetDate) }}
                    </span>
                  </div>
                </div>
                <button
                  class="text-on-surface-variant hover:text-error transition-colors shrink-0"
                  aria-label="Delete goal"
                  @click="wallet.deleteGoal(g.id)"
                >
                  <span class="material-symbols-outlined !text-[18px]">delete</span>
                </button>
              </div>

              <div class="h-2 rounded-full bg-surface-container-high overflow-hidden">
                <div
                  class="h-full rounded-full bg-primary transition-all"
                  :style="{ width: g.progressPercent + '%' }"
                />
              </div>

              <div class="flex items-center justify-between text-body-sm">
                <span class="text-on-surface">{{ formatMoney(g.savedMinor, g.currency) }} saved</span>
                <span class="text-on-surface-variant">of {{ formatMoney(g.targetAmountMinor, g.currency) }}</span>
              </div>

              <button
                class="mt-base self-end text-label-md text-primary hover:underline"
                @click="contributingGoal = g"
              >
                + Contribute
              </button>
            </div>
          </div>
        </template>

        <!-- Accounts -->
        <template v-if="activeTab === 'accounts'">
          <div v-if="wallet.accounts.length === 0" class="flex flex-col items-center justify-center text-center gap-stack-sm py-stack-lg">
            <span class="material-symbols-outlined !text-[48px] text-on-surface-variant">account_balance</span>
            <p class="text-body-md text-on-surface-variant">No accounts yet. Add a cash jar or bank account.</p>
          </div>
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-stack-sm pb-stack-md">
            <div v-for="a in wallet.accounts" :key="a.id" class="bg-surface-container rounded-xl p-stack-md flex flex-col gap-base" :class="{ 'opacity-60': a.archived }">
              <div class="flex items-center justify-between">
                <span class="font-label-md text-label-md text-on-surface">{{ a.name }}</span>
                <span class="text-body-sm text-on-surface-variant capitalize">{{ a.type.toLowerCase() }}</span>
              </div>
              <span class="font-headline text-headline-sm text-on-surface">{{ formatMoney(a.balanceMinor, a.currency) }}</span>
            </div>
          </div>
        </template>
      </template>
    </main>

    <TransactionModal v-if="showTransaction" @close="showTransaction = false" @saved="refresh" />
    <BudgetModal v-if="showBudget" @close="showBudget = false" @saved="refresh" />
    <DebtModal v-if="showDebt" @close="showDebt = false" @saved="refresh" />
    <AccountModal v-if="showAccount" @close="showAccount = false" @saved="refresh" />
    <CreateGoalModal v-if="showGoal" @close="showGoal = false" @saved="refresh" />
    <DebtPaymentModal v-if="payingDebt" :debt="payingDebt" @close="payingDebt = null" @saved="refresh" />
    <GoalContributionModal v-if="contributingGoal" :goal="contributingGoal" @close="contributingGoal = null" @saved="refresh" />
  </div>
</template>
