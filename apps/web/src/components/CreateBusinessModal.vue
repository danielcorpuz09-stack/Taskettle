<script setup lang="ts">
import { reactive, ref } from 'vue';
import BaseModal from './BaseModal.vue';
import { useBusinessStore } from '@/stores/business';
import { useBoardStore } from '@/stores/board';
import { useWalletStore } from '@/stores/wallet';
import { apiErrorMessage } from '@/lib/api';
import { toMinor } from '@/lib/money';
import type { BusinessType } from '@/types';

const emit = defineEmits<{ (e: 'close'): void; (e: 'saved'): void }>();

const business = useBusinessStore();
const board = useBoardStore();
const wallet = useWalletStore();

const TYPES: { value: BusinessType; label: string }[] = [
  { value: 'PRINTING_3D', label: '3D Printing' },
  { value: 'GENERAL', label: 'General' },
];

const form = reactive({
  name: '',
  type: 'PRINTING_3D' as BusinessType,
  currency: 'PHP',
  defaultAccountId: '',
  printerPowerW: '',
  printerPrice: '',
  printerLifespanHr: '',
  electricityRatePerKwh: '',
  laborRatePerHr: '',
  failurePct: '',
  markupPct: '',
});
const showDefaults = ref(false);
const error = ref('');
const saving = ref(false);

function num(v: string): number | null {
  if (v.trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function money(v: string): number | null {
  if (v.trim() === '') return null;
  return toMinor(v);
}

async function submit() {
  if (!form.name.trim()) return;
  error.value = '';
  saving.value = true;
  try {
    await business.createBusiness(board.currentCircleId!, {
      name: form.name.trim(),
      type: form.type,
      currency: form.currency.trim().toUpperCase() || 'PHP',
      defaultAccountId: form.defaultAccountId || null,
      printerPowerW: num(form.printerPowerW),
      printerPriceMinor: money(form.printerPrice),
      printerLifespanHr: num(form.printerLifespanHr),
      electricityRatePerKwhMinor: money(form.electricityRatePerKwh),
      laborRatePerHrMinor: money(form.laborRatePerHr),
      failurePct: num(form.failurePct),
      markupPct: num(form.markupPct),
    });
    emit('saved');
  } catch (err) {
    error.value = apiErrorMessage(err, 'Could not create business');
  } finally {
    saving.value = false;
  }
}

const inputClass =
  'w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md';
</script>

<template>
  <BaseModal title="New Business" @close="emit('close')">
    <form class="flex flex-col gap-stack-sm" @submit.prevent="submit">
      <p v-if="error" class="bg-error-container text-on-error-container rounded-lg px-stack-sm py-base text-body-md">
        {{ error }}
      </p>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="biz-name">Name *</label>
        <input id="biz-name" v-model="form.name" type="text" required placeholder="e.g. My 3D Prints" :class="inputClass" />
      </div>

      <div class="grid grid-cols-2 gap-stack-sm">
        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="biz-type">Type</label>
          <select id="biz-type" v-model="form.type" :class="inputClass">
            <option v-for="t in TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
          </select>
        </div>
        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="biz-currency">Currency</label>
          <input id="biz-currency" v-model="form.currency" type="text" maxlength="3" :class="inputClass" />
        </div>
      </div>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="biz-account">Wallet account</label>
        <select id="biz-account" v-model="form.defaultAccountId" :class="inputClass">
          <option value="">None (choose when recording)</option>
          <option v-for="a in wallet.activeAccounts" :key="a.id" :value="a.id">{{ a.name }}</option>
        </select>
        <p class="text-body-sm text-on-surface-variant">Sales &amp; expenses post to this account.</p>
      </div>

      <button
        type="button"
        class="flex items-center gap-2 text-label-md text-primary mt-base"
        @click="showDefaults = !showDefaults"
      >
        <span class="material-symbols-outlined !text-[20px]">{{ showDefaults ? 'expand_less' : 'expand_more' }}</span>
        Print calculator defaults (optional)
      </button>

      <div v-if="showDefaults" class="grid grid-cols-2 gap-stack-sm">
        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="d-power">Printer power (W)</label>
          <input id="d-power" v-model="form.printerPowerW" type="number" min="0" :class="inputClass" />
        </div>
        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="d-price">Printer price</label>
          <input id="d-price" v-model="form.printerPrice" type="number" min="0" step="0.01" :class="inputClass" />
        </div>
        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="d-life">Printer lifespan (hr)</label>
          <input id="d-life" v-model="form.printerLifespanHr" type="number" min="1" :class="inputClass" />
        </div>
        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="d-elec">Electricity / kWh</label>
          <input id="d-elec" v-model="form.electricityRatePerKwh" type="number" min="0" step="0.01" :class="inputClass" />
        </div>
        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="d-labor">Labor / hr</label>
          <input id="d-labor" v-model="form.laborRatePerHr" type="number" min="0" step="0.01" :class="inputClass" />
        </div>
        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="d-fail">Failure %</label>
          <input id="d-fail" v-model="form.failurePct" type="number" min="0" max="100" step="0.1" :class="inputClass" />
        </div>
        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="d-markup">Markup %</label>
          <input id="d-markup" v-model="form.markupPct" type="number" min="0" max="100" step="0.1" :class="inputClass" />
        </div>
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
          {{ saving ? 'Saving…' : 'Create' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>
