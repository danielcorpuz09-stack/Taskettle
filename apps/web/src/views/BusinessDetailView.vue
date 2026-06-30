<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useBoardStore } from '@/stores/board';
import { useBusinessStore } from '@/stores/business';
import { useWalletStore } from '@/stores/wallet';
import { apiErrorMessage } from '@/lib/api';
import { formatMoney } from '@/lib/money';
import { formatDueLabel } from '@/lib/date';
import PrintCalculator from '@/components/PrintCalculator.vue';
import RecordBusinessTransactionModal from '@/components/RecordBusinessTransactionModal.vue';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const board = useBoardStore();
const business = useBusinessStore();
const wallet = useWalletStore();

const businessId = computed(() => String(route.params.businessId));
const current = computed(() => business.current);
const error = ref('');

type Tab = 'overview' | 'transactions' | 'calculator' | 'products';
const activeTab = ref<Tab>('overview');
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: 'monitoring' },
  { id: 'transactions', label: 'Sales & Expenses', icon: 'receipt_long' },
  { id: 'calculator', label: 'Calculator', icon: 'calculate' },
  { id: 'products', label: 'Products', icon: 'inventory_2' },
];

const recordKind = ref<'sale' | 'expense' | null>(null);

async function loadAll(id: string) {
  try {
    await Promise.all([
      business.fetchBusiness(id),
      business.fetchDashboard(id),
      business.fetchTransactions(id),
      business.fetchProducts(id),
    ]);
    const circleId = business.current?.circleId;
    if (circleId) {
      await Promise.all([wallet.fetchAccounts(circleId), wallet.fetchCategories(circleId)]);
    }
  } catch (err) {
    error.value = apiErrorMessage(err);
  }
}

watch(businessId, (id) => {
  if (id) loadAll(id);
});

onMounted(async () => {
  if (!board.circles.length) {
    try {
      await Promise.all([auth.fetchMe(), board.fetchCircles()]);
    } catch (err) {
      error.value = apiErrorMessage(err);
    }
  }
  await loadAll(businessId.value);
});

const currency = computed(() => current.value?.currency ?? 'PHP');

async function onTransactionSaved() {
  recordKind.value = null;
  await Promise.all([
    business.fetchDashboard(businessId.value),
    business.fetchTransactions(businessId.value),
  ]);
}

async function onProductSaved() {
  await business.fetchDashboard(businessId.value);
}

async function removeProduct(id: string) {
  try {
    await business.deleteProduct(businessId.value, id);
    await business.fetchDashboard(businessId.value);
  } catch (err) {
    error.value = apiErrorMessage(err);
  }
}

function txLabel(t: { note: string | null; payee: string | null }): string {
  return t.note || t.payee || 'Transaction';
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-surface">
    <header class="bg-surface fixed top-0 w-full z-40 border-b border-surface-container">
      <nav class="flex justify-between items-center w-full px-container-padding-mobile sm:px-container-padding-desktop py-stack-sm max-w-[1440px] mx-auto gap-base">
        <div class="flex items-center gap-stack-sm min-w-0">
          <button
            class="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container transition-colors shrink-0"
            @click="router.push({ name: 'business' })"
          >
            <span class="material-symbols-outlined text-on-surface-variant">arrow_back</span>
          </button>
          <span class="font-headline-lg text-headline-md text-on-surface truncate">
            {{ current?.name ?? 'Business' }}
          </span>
        </div>
        <div class="flex items-center gap-base shrink-0">
          <button
            class="bg-surface-container text-on-surface px-stack-sm py-2 rounded-full font-label-md flex items-center gap-base hover:bg-surface-container-high active:scale-95 transition-all"
            @click="recordKind = 'expense'"
          >
            <span class="material-symbols-outlined !text-[20px]">remove</span>
            <span class="hidden sm:inline">Expense</span>
          </button>
          <button
            class="bg-primary text-on-primary px-stack-sm py-2 rounded-full font-label-md flex items-center gap-base hover:opacity-90 active:scale-95 transition-all"
            @click="recordKind = 'sale'"
          >
            <span class="material-symbols-outlined !text-[20px]">add</span>
            <span class="hidden sm:inline">Sale</span>
          </button>
        </div>
      </nav>
    </header>

    <main class="flex-1 pt-[72px] px-container-padding-mobile sm:px-container-padding-desktop max-w-[1120px] mx-auto w-full pb-stack-lg">
      <p v-if="error" class="mt-stack-sm bg-error-container text-on-error-container rounded-lg px-stack-sm py-base text-body-md">
        {{ error }}
      </p>

      <!-- Tabs -->
      <div class="flex gap-base overflow-x-auto py-stack-sm -mx-1 px-1">
        <button
          v-for="tab in TABS"
          :key="tab.id"
          class="flex items-center gap-base px-stack-sm py-2 rounded-full font-label-md whitespace-nowrap transition-colors"
          :class="activeTab === tab.id ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'"
          @click="activeTab = tab.id"
        >
          <span class="material-symbols-outlined !text-[20px]">{{ tab.icon }}</span>
          {{ tab.label }}
        </button>
      </div>

      <!-- Overview -->
      <section v-if="activeTab === 'overview'" class="flex flex-col gap-stack-sm">
        <div v-if="business.dashboard" class="grid grid-cols-2 lg:grid-cols-3 gap-stack-sm">
          <div class="bg-surface-container rounded-xl p-stack-md flex flex-col gap-base">
            <span class="text-label-sm text-on-surface-variant uppercase tracking-wide">Revenue (month)</span>
            <span class="font-headline-md text-headline-md text-primary">{{ formatMoney(business.dashboard.revenueMonthMinor, currency) }}</span>
          </div>
          <div class="bg-surface-container rounded-xl p-stack-md flex flex-col gap-base">
            <span class="text-label-sm text-on-surface-variant uppercase tracking-wide">Expenses (month)</span>
            <span class="font-headline-md text-headline-md text-secondary">{{ formatMoney(business.dashboard.expenseMonthMinor, currency) }}</span>
          </div>
          <div class="bg-primary-container rounded-xl p-stack-md flex flex-col gap-base">
            <span class="text-label-sm text-on-primary-container uppercase tracking-wide">Profit (month)</span>
            <span class="font-headline-md text-headline-md text-on-primary-container">{{ formatMoney(business.dashboard.profitMonthMinor, currency) }}</span>
          </div>
          <div class="bg-surface-container rounded-xl p-stack-md flex flex-col gap-base">
            <span class="text-label-sm text-on-surface-variant uppercase tracking-wide">Revenue (all)</span>
            <span class="font-label-lg text-label-lg text-on-surface">{{ formatMoney(business.dashboard.revenueTotalMinor, currency) }}</span>
          </div>
          <div class="bg-surface-container rounded-xl p-stack-md flex flex-col gap-base">
            <span class="text-label-sm text-on-surface-variant uppercase tracking-wide">Profit (all)</span>
            <span class="font-label-lg text-label-lg text-on-surface">{{ formatMoney(business.dashboard.profitTotalMinor, currency) }}</span>
          </div>
          <div class="bg-surface-container rounded-xl p-stack-md flex flex-col gap-base">
            <span class="text-label-sm text-on-surface-variant uppercase tracking-wide">Products · Sales</span>
            <span class="font-label-lg text-label-lg text-on-surface">{{ business.dashboard.productCount }} · {{ business.dashboard.saleCount }}</span>
          </div>
        </div>
      </section>

      <!-- Transactions -->
      <section v-else-if="activeTab === 'transactions'" class="flex flex-col gap-base">
        <div v-if="business.transactions.length === 0" class="text-center text-on-surface-variant py-stack-lg text-body-md">
          No sales or expenses yet.
        </div>
        <ul v-else class="flex flex-col gap-base">
          <li
            v-for="t in business.transactions"
            :key="t.id"
            class="bg-surface-container rounded-xl p-stack-sm flex items-center justify-between gap-stack-sm"
          >
            <div class="flex items-center gap-stack-sm min-w-0">
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                :class="t.type === 'INCOME' ? 'bg-primary-container' : 'bg-surface-container-high'"
              >
                <span class="material-symbols-outlined !text-[20px]" :class="t.type === 'INCOME' ? 'text-on-primary-container' : 'text-on-surface-variant'">
                  {{ t.type === 'INCOME' ? 'trending_up' : 'trending_down' }}
                </span>
              </div>
              <div class="flex flex-col min-w-0">
                <span class="font-label-md text-label-md text-on-surface truncate">{{ txLabel(t) }}</span>
                <span class="text-body-sm text-on-surface-variant">{{ formatDueLabel(t.transactionDate) }}</span>
              </div>
            </div>
            <span class="font-label-md text-label-md shrink-0" :class="t.type === 'INCOME' ? 'text-primary' : 'text-secondary'">
              {{ t.type === 'INCOME' ? '+' : '-' }}{{ formatMoney(t.amountMinor, t.currency) }}
            </span>
          </li>
        </ul>
      </section>

      <!-- Calculator -->
      <section v-else-if="activeTab === 'calculator'">
        <PrintCalculator v-if="current" :business="current" @saved="onProductSaved" />
      </section>

      <!-- Products -->
      <section v-else-if="activeTab === 'products'" class="flex flex-col gap-base">
        <div v-if="business.products.length === 0" class="text-center text-on-surface-variant py-stack-lg text-body-md">
          No saved products yet. Use the Calculator to price one and save it.
        </div>
        <ul v-else class="grid grid-cols-1 sm:grid-cols-2 gap-stack-sm">
          <li v-for="p in business.products" :key="p.id" class="bg-surface-container rounded-xl p-stack-md flex flex-col gap-base">
            <div class="flex items-start justify-between gap-base">
              <span class="font-label-lg text-label-lg text-on-surface">{{ p.name }}</span>
              <button
                class="text-on-surface-variant hover:text-error p-1 rounded-full hover:bg-surface-container-high transition-colors"
                aria-label="Delete product"
                @click="removeProduct(p.id)"
              >
                <span class="material-symbols-outlined !text-[20px]">delete</span>
              </button>
            </div>
            <span class="font-headline-md text-headline-md text-primary">{{ formatMoney(p.breakdown.finalPriceMinor, p.currency) }}</span>
            <dl class="text-body-sm text-on-surface-variant flex flex-col gap-0.5">
              <div class="flex justify-between"><dt>Material</dt><dd>{{ formatMoney(p.breakdown.materialCostMinor, p.currency) }}</dd></div>
              <div class="flex justify-between"><dt>Subtotal</dt><dd>{{ formatMoney(p.breakdown.subtotalMinor, p.currency) }}</dd></div>
              <div class="flex justify-between"><dt>Markup</dt><dd>{{ p.breakdown.markupPct }}%</dd></div>
            </dl>
          </li>
        </ul>
      </section>
    </main>

    <RecordBusinessTransactionModal
      v-if="recordKind && current"
      :business="current"
      :kind="recordKind"
      @close="recordKind = null"
      @saved="onTransactionSaved"
    />
  </div>
</template>
