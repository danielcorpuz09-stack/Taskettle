<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import BaseModal from './BaseModal.vue';
import { useBusinessStore } from '@/stores/business';
import { useWalletStore } from '@/stores/wallet';
import { apiErrorMessage } from '@/lib/api';
import { toMinor } from '@/lib/money';
import { fromDateTimeLocal, toDateTimeLocal } from '@/lib/date';
import type { Business } from '@/types';

const props = defineProps<{ business: Business; kind: 'sale' | 'expense' }>();
const emit = defineEmits<{ (e: 'close'): void; (e: 'saved'): void }>();

const business = useBusinessStore();
const wallet = useWalletStore();

const isSale = computed(() => props.kind === 'sale');
const title = computed(() => (isSale.value ? 'Record Sale' : 'Record Expense'));

const form = reactive({
  amount: '',
  accountId: props.business.defaultAccountId ?? '',
  productId: '',
  categoryId: '',
  note: '',
  payee: '',
  transactionDate: toDateTimeLocal(new Date().toISOString()),
});
const error = ref('');
const saving = ref(false);

const categories = computed(() =>
  isSale.value ? wallet.incomeCategories : wallet.expenseCategories
);

function applyProduct() {
  const product = business.products.find((p) => p.id === form.productId);
  if (product) {
    form.amount = (product.breakdown.finalPriceMinor / 100).toFixed(2);
    if (!form.note) form.note = product.name;
  }
}

async function submit() {
  const amountMinor = toMinor(form.amount);
  if (amountMinor <= 0) {
    error.value = 'Amount must be greater than zero';
    return;
  }
  if (!form.accountId) {
    error.value = 'Please choose a wallet account';
    return;
  }
  error.value = '';
  saving.value = true;
  try {
    const payload: Record<string, unknown> = {
      amountMinor,
      accountId: form.accountId,
      categoryId: form.categoryId || null,
      note: form.note.trim() || null,
      payee: form.payee.trim() || null,
      transactionDate: fromDateTimeLocal(form.transactionDate) ?? undefined,
    };
    if (isSale.value) {
      payload.productId = form.productId || null;
      await business.recordSale(props.business.id, payload);
    } else {
      await business.recordExpense(props.business.id, payload);
    }
    emit('saved');
  } catch (err) {
    error.value = apiErrorMessage(err, 'Could not save');
  } finally {
    saving.value = false;
  }
}

const inputClass =
  'w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md';
</script>

<template>
  <BaseModal :title="title" @close="emit('close')">
    <form class="flex flex-col gap-stack-sm" @submit.prevent="submit">
      <p v-if="error" class="bg-error-container text-on-error-container rounded-lg px-stack-sm py-base text-body-md">
        {{ error }}
      </p>

      <div v-if="isSale && business.products.length" class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="rt-product">From product</label>
        <select id="rt-product" v-model="form.productId" :class="inputClass" @change="applyProduct">
          <option value="">None</option>
          <option v-for="p in business.products" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
      </div>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="rt-amount">Amount *</label>
        <input id="rt-amount" v-model="form.amount" type="number" min="0" step="0.01" required placeholder="0.00" :class="inputClass" />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-stack-sm">
        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="rt-account">Account *</label>
          <select id="rt-account" v-model="form.accountId" required :class="inputClass">
            <option value="">Choose…</option>
            <option v-for="a in wallet.activeAccounts" :key="a.id" :value="a.id">{{ a.name }}</option>
          </select>
        </div>
        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="rt-category">Category</label>
          <select id="rt-category" v-model="form.categoryId" :class="inputClass">
            <option value="">None</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
      </div>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="rt-payee">
          {{ isSale ? 'Customer' : 'Payee' }}
        </label>
        <input id="rt-payee" v-model="form.payee" type="text" :class="inputClass" />
      </div>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="rt-note">Note</label>
        <input id="rt-note" v-model="form.note" type="text" :class="inputClass" />
      </div>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="rt-date">Date</label>
        <input id="rt-date" v-model="form.transactionDate" type="datetime-local" :class="inputClass" />
      </div>

      <div class="flex gap-stack-sm mt-stack-sm">
        <button
          type="button"
          class="flex-1 py-stack-sm rounded-full border border-outline-variant text-on-surface font-label-md hover:bg-surface-container transition-colors"
          @click="emit('close')"
        >
          Cancel
        </button>
        <button
          type="submit"
          :disabled="saving"
          class="flex-1 py-stack-sm rounded-full bg-primary text-on-primary font-label-md hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
        >
          {{ saving ? 'Saving…' : 'Save' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>
