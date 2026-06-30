<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import BaseModal from './BaseModal.vue';
import { useBusinessStore } from '@/stores/business';
import { apiErrorMessage } from '@/lib/api';
import { formatMoney } from '@/lib/money';
import type { Business, Product } from '@/types';

const props = defineProps<{ business: Business; product: Product }>();
const emit = defineEmits<{ (e: 'close'): void; (e: 'saved'): void }>();

const business = useBusinessStore();

const form = reactive({
  quantity: 1,
  customer: '',
  deadline: '',
  priority: 'MEDIUM',
});
const error = ref('');
const saving = ref(false);

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const unitMinor = computed(() => props.product.breakdown.finalPriceMinor);
const totalMinor = computed(() => unitMinor.value * Math.max(1, form.quantity));

async function submit() {
  const qty = Math.floor(form.quantity);
  if (!Number.isFinite(qty) || qty < 1) {
    error.value = 'Quantity must be at least 1';
    return;
  }
  error.value = '';
  saving.value = true;
  try {
    const lines = [
      `${qty} × ${props.product.name}`,
      `Unit: ${formatMoney(unitMinor.value, props.product.currency)} · Total: ${formatMoney(
        totalMinor.value,
        props.product.currency
      )}`,
    ];
    if (form.customer.trim()) lines.unshift(`Customer: ${form.customer.trim()}`);

    await business.addProductToBacklog(props.business.circleId, {
      title: `${qty}× ${props.product.name}`,
      description: lines.join('\n'),
      dueDate: form.deadline ? new Date(`${form.deadline}T12:00`).toISOString() : null,
      priority: form.priority,
      category: 'Orders',
    });
    emit('saved');
  } catch (err) {
    error.value = apiErrorMessage(err, 'Could not add order to backlog');
  } finally {
    saving.value = false;
  }
}

const inputClass =
  'w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md';
</script>

<template>
  <BaseModal title="Add order to backlog" @close="emit('close')">
    <form class="flex flex-col gap-stack-sm" @submit.prevent="submit">
      <p v-if="error" class="bg-error-container text-on-error-container rounded-lg px-stack-sm py-base text-body-md">
        {{ error }}
      </p>

      <div class="bg-surface-container rounded-lg px-stack-sm py-base flex items-center justify-between gap-base">
        <span class="font-label-md text-label-md text-on-surface">{{ product.name }}</span>
        <span class="text-body-sm text-on-surface-variant">
          {{ formatMoney(unitMinor, product.currency) }} each
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-stack-sm">
        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="ob-qty">Quantity *</label>
          <input id="ob-qty" v-model.number="form.quantity" type="number" min="1" step="1" required :class="inputClass" />
        </div>
        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="ob-priority">Priority</label>
          <select id="ob-priority" v-model="form.priority" :class="inputClass">
            <option v-for="p in PRIORITIES" :key="p" :value="p">{{ p.charAt(0) + p.slice(1).toLowerCase() }}</option>
          </select>
        </div>
      </div>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="ob-customer">Customer (optional)</label>
        <input id="ob-customer" v-model="form.customer" type="text" placeholder="Who's this for?" :class="inputClass" />
      </div>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="ob-deadline">Deadline</label>
        <input id="ob-deadline" v-model="form.deadline" type="date" :class="inputClass" />
      </div>

      <div class="bg-surface-container-low rounded-lg px-stack-sm py-base flex items-center justify-between gap-base">
        <span class="text-body-sm text-on-surface-variant">Order total</span>
        <span class="font-headline-md text-headline-sm text-primary">{{ formatMoney(totalMinor, product.currency) }}</span>
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
          {{ saving ? 'Adding…' : 'Add to backlog' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>
