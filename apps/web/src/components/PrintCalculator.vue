<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useBusinessStore } from '@/stores/business';
import { apiErrorMessage } from '@/lib/api';
import { formatMoney, toMinor } from '@/lib/money';
import type { Business, CalculationInput, CostBreakdown } from '@/types';

const props = defineProps<{ business: Business }>();
const emit = defineEmits<{ (e: 'saved'): void }>();

const business = useBusinessStore();
const currency = computed(() => props.business.currency);

function major(minor: number | null): string {
  return minor == null ? '' : (minor / 100).toFixed(2);
}

const form = reactive({
  filaments: [{ name: '', weightG: '', costPerKg: '' }] as {
    name: string;
    weightG: string;
    costPerKg: string;
  }[],
  printTimeHr: '',
  printerPowerW: props.business.printerPowerW != null ? String(props.business.printerPowerW) : '',
  electricityRatePerKwh: major(props.business.electricityRatePerKwhMinor),
  printerPrice: major(props.business.printerPriceMinor),
  printerLifespanHr:
    props.business.printerLifespanHr != null ? String(props.business.printerLifespanHr) : '',
  laborRatePerHr: major(props.business.laborRatePerHrMinor),
  laborTimeHr: '',
  failurePct: props.business.failurePct != null ? String(props.business.failurePct) : '0',
  markupPct: props.business.markupPct != null ? String(props.business.markupPct) : '0',
});

const productName = ref('');
const error = ref('');
const saving = ref(false);

function n(v: string): number {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

const calculation = computed<CalculationInput>(() => ({
  filaments: form.filaments
    .filter((f) => n(f.weightG) > 0 || n(f.costPerKg) > 0)
    .map((f) => ({
      name: f.name.trim() || undefined,
      weightG: n(f.weightG),
      costPerKgMinor: toMinor(f.costPerKg),
    })),
  printTimeHr: n(form.printTimeHr),
  printerPowerW: n(form.printerPowerW),
  electricityRatePerKwhMinor: toMinor(form.electricityRatePerKwh),
  printerPriceMinor: toMinor(form.printerPrice),
  printerLifespanHr: Math.max(n(form.printerLifespanHr), 1),
  laborRatePerHrMinor: toMinor(form.laborRatePerHr),
  laborTimeHr: n(form.laborTimeHr),
  failurePct: n(form.failurePct),
  markupPct: n(form.markupPct),
}));

// Local mirror of the server formula for instant feedback.
const breakdown = computed<CostBreakdown>(() => {
  const c = calculation.value;
  const materialCostMinor = Math.round(
    c.filaments.reduce((s, f) => s + (f.weightG / 1000) * f.costPerKgMinor, 0)
  );
  const electricityCostMinor = Math.round(
    (c.printerPowerW / 1000) * c.printTimeHr * c.electricityRatePerKwhMinor
  );
  const wearCostMinor = Math.round((c.printerPriceMinor / c.printerLifespanHr) * c.printTimeHr);
  const laborCostMinor = Math.round(c.laborRatePerHrMinor * c.laborTimeHr);
  const subtotalMinor = materialCostMinor + electricityCostMinor + wearCostMinor + laborCostMinor;
  const failureCostMinor = Math.round((subtotalMinor * c.failurePct) / 100);
  const profitMinor = Math.round(((subtotalMinor + failureCostMinor) * c.markupPct) / 100);
  const finalPriceMinor = subtotalMinor + failureCostMinor + profitMinor;
  return {
    materialCostMinor,
    electricityCostMinor,
    wearCostMinor,
    laborCostMinor,
    subtotalMinor,
    failureCostMinor,
    profitMinor,
    finalPriceMinor,
    failurePct: c.failurePct,
    markupPct: c.markupPct,
  };
});

function addFilament() {
  form.filaments.push({ name: '', weightG: '', costPerKg: '' });
}
function removeFilament(idx: number) {
  form.filaments.splice(idx, 1);
  if (form.filaments.length === 0) addFilament();
}

async function saveProduct() {
  if (!productName.value.trim()) {
    error.value = 'Give the product a name to save it';
    return;
  }
  if (calculation.value.filaments.length === 0) {
    error.value = 'Add at least one filament with weight and cost';
    return;
  }
  error.value = '';
  saving.value = true;
  try {
    await business.createProduct(props.business.id, {
      name: productName.value.trim(),
      currency: currency.value,
      calculation: calculation.value,
    });
    productName.value = '';
    emit('saved');
  } catch (err) {
    error.value = apiErrorMessage(err, 'Could not save product');
  } finally {
    saving.value = false;
  }
}

const inputClass =
  'w-full px-stack-sm py-2 bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md';
const sectionClass = 'bg-surface-container rounded-xl p-stack-sm flex flex-col gap-stack-sm';
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-stack-md items-start">
    <!-- Inputs -->
    <div class="flex flex-col gap-stack-sm">
      <p v-if="error" class="bg-error-container text-on-error-container rounded-lg px-stack-sm py-base text-body-md">
        {{ error }}
      </p>

      <!-- Material -->
      <div :class="sectionClass">
        <div class="flex items-center gap-2 text-on-surface">
          <span class="material-symbols-outlined !text-[20px] text-primary">colors</span>
          <h3 class="font-label-lg text-label-lg">Material</h3>
        </div>
        <div
          v-for="(f, idx) in form.filaments"
          :key="idx"
          class="grid grid-cols-[1fr_auto] gap-base items-end"
        >
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-base">
            <input v-model="f.name" type="text" placeholder="Filament (e.g. PLA Black)" :class="inputClass" />
            <input v-model="f.weightG" type="number" min="0" step="0.1" placeholder="Weight (g)" :class="inputClass" />
            <input v-model="f.costPerKg" type="number" min="0" step="0.01" placeholder="Cost / kg" :class="inputClass" />
          </div>
          <button
            type="button"
            class="text-on-surface-variant hover:text-error p-2 rounded-full hover:bg-surface-container-high transition-colors"
            aria-label="Remove filament"
            @click="removeFilament(idx)"
          >
            <span class="material-symbols-outlined !text-[20px]">delete</span>
          </button>
        </div>
        <button type="button" class="flex items-center gap-2 text-label-md text-primary self-start" @click="addFilament">
          <span class="material-symbols-outlined !text-[20px]">add</span>
          Add filament
        </button>
      </div>

      <!-- Printer -->
      <div :class="sectionClass">
        <div class="flex items-center gap-2 text-on-surface">
          <span class="material-symbols-outlined !text-[20px] text-primary">print</span>
          <h3 class="font-label-lg text-label-lg">Printer &amp; electricity</h3>
        </div>
        <div class="grid grid-cols-2 gap-base">
          <label class="flex flex-col gap-base text-label-sm text-on-surface-variant">
            Print time (hr)
            <input v-model="form.printTimeHr" type="number" min="0" step="0.1" :class="inputClass" />
          </label>
          <label class="flex flex-col gap-base text-label-sm text-on-surface-variant">
            Printer power (W)
            <input v-model="form.printerPowerW" type="number" min="0" :class="inputClass" />
          </label>
          <label class="flex flex-col gap-base text-label-sm text-on-surface-variant">
            Electricity / kWh
            <input v-model="form.electricityRatePerKwh" type="number" min="0" step="0.01" :class="inputClass" />
          </label>
          <label class="flex flex-col gap-base text-label-sm text-on-surface-variant">
            Printer price
            <input v-model="form.printerPrice" type="number" min="0" step="0.01" :class="inputClass" />
          </label>
          <label class="flex flex-col gap-base text-label-sm text-on-surface-variant">
            Printer lifespan (hr)
            <input v-model="form.printerLifespanHr" type="number" min="1" :class="inputClass" />
          </label>
        </div>
      </div>

      <!-- Labor -->
      <div :class="sectionClass">
        <div class="flex items-center gap-2 text-on-surface">
          <span class="material-symbols-outlined !text-[20px] text-primary">engineering</span>
          <h3 class="font-label-lg text-label-lg">Labor</h3>
        </div>
        <div class="grid grid-cols-2 gap-base">
          <label class="flex flex-col gap-base text-label-sm text-on-surface-variant">
            Labor rate / hr
            <input v-model="form.laborRatePerHr" type="number" min="0" step="0.01" :class="inputClass" />
          </label>
          <label class="flex flex-col gap-base text-label-sm text-on-surface-variant">
            Labor time (hr)
            <input v-model="form.laborTimeHr" type="number" min="0" step="0.1" :class="inputClass" />
          </label>
        </div>
      </div>

      <!-- Business -->
      <div :class="sectionClass">
        <div class="flex items-center gap-2 text-on-surface">
          <span class="material-symbols-outlined !text-[20px] text-primary">storefront</span>
          <h3 class="font-label-lg text-label-lg">Business</h3>
        </div>
        <div class="grid grid-cols-2 gap-base">
          <label class="flex flex-col gap-base text-label-sm text-on-surface-variant">
            Failure / spoilage %
            <input v-model="form.failurePct" type="number" min="0" max="100" step="0.1" :class="inputClass" />
          </label>
          <label class="flex flex-col gap-base text-label-sm text-on-surface-variant">
            Markup / profit %
            <input v-model="form.markupPct" type="number" min="0" max="100" step="0.1" :class="inputClass" />
          </label>
        </div>
      </div>
    </div>

    <!-- Breakdown -->
    <div class="bg-primary-container rounded-xl p-stack-md flex flex-col gap-base lg:sticky lg:top-[88px]">
      <h3 class="font-label-lg text-label-lg text-on-primary-container">Cost breakdown</h3>
      <dl class="flex flex-col gap-1 text-body-md text-on-primary-container">
        <div class="flex justify-between"><dt>Material</dt><dd>{{ formatMoney(breakdown.materialCostMinor, currency) }}</dd></div>
        <div class="flex justify-between"><dt>Electricity</dt><dd>{{ formatMoney(breakdown.electricityCostMinor, currency) }}</dd></div>
        <div class="flex justify-between"><dt>Printer wear</dt><dd>{{ formatMoney(breakdown.wearCostMinor, currency) }}</dd></div>
        <div class="flex justify-between"><dt>Labor</dt><dd>{{ formatMoney(breakdown.laborCostMinor, currency) }}</dd></div>
        <div class="flex justify-between border-t border-on-primary-container/20 pt-1 mt-1 font-label-md">
          <dt>Subtotal</dt><dd>{{ formatMoney(breakdown.subtotalMinor, currency) }}</dd>
        </div>
        <div class="flex justify-between"><dt>Failure ({{ breakdown.failurePct }}%)</dt><dd>{{ formatMoney(breakdown.failureCostMinor, currency) }}</dd></div>
        <div class="flex justify-between"><dt>Profit ({{ breakdown.markupPct }}%)</dt><dd>{{ formatMoney(breakdown.profitMinor, currency) }}</dd></div>
      </dl>
      <div class="flex justify-between items-baseline border-t border-on-primary-container/30 pt-stack-sm mt-base">
        <span class="font-label-lg text-label-lg text-on-primary-container">Final price</span>
        <span class="font-headline-lg text-headline-md text-on-primary-container">{{ formatMoney(breakdown.finalPriceMinor, currency) }}</span>
      </div>

      <div class="flex flex-col gap-base mt-stack-sm">
        <input
          v-model="productName"
          type="text"
          placeholder="Save as product…"
          class="w-full px-stack-sm py-2 bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
        />
        <button
          type="button"
          :disabled="saving"
          class="w-full py-stack-sm rounded-full bg-primary text-on-primary font-label-md hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
          @click="saveProduct"
        >
          {{ saving ? 'Saving…' : 'Save product' }}
        </button>
      </div>
    </div>
  </div>
</template>
