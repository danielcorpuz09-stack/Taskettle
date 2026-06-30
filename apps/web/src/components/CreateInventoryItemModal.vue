<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import BaseModal from './BaseModal.vue';
import { useInventoryStore } from '@/stores/inventory';
import { useBoardStore } from '@/stores/board';
import { useBusinessStore } from '@/stores/business';
import { apiErrorMessage } from '@/lib/api';
import { toMinor } from '@/lib/money';

const emit = defineEmits<{ (e: 'close'): void; (e: 'created'): void }>();

const board = useBoardStore();
const inventory = useInventoryStore();
const business = useBusinessStore();

const CATEGORIES = ['Groceries', 'Household', 'Medicine', 'Tools', 'Electronics', 'School Supplies', 'DIY Materials', 'Pet Supplies'];

const form = reactive({
  name: '',
  description: '',
  category: '',
  quantity: 0,
  unit: '',
  minimumThreshold: 0,
  location: '',
  unitPrice: '',
  businessId: '',
  notes: '',
});
const error = ref('');
const saving = ref(false);

onMounted(() => {
  if (board.currentCircleId && business.businesses.length === 0) {
    business.fetchBusinesses(board.currentCircleId).catch(() => {});
  }
});

async function submit() {
  if (!form.name.trim()) return;
  error.value = '';
  saving.value = true;
  try {
    await inventory.createItem(board.currentCircleId!, {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      category: form.category || undefined,
      quantity: form.quantity,
      unit: form.unit.trim() || undefined,
      minimumThreshold: form.minimumThreshold,
      location: form.location.trim() || undefined,
      unitPriceMinor: form.unitPrice ? toMinor(form.unitPrice) : undefined,
      businessId: form.businessId || undefined,
      notes: form.notes.trim() || undefined,
    } as any);
    emit('created');
  } catch (err) {
    error.value = apiErrorMessage(err, 'Could not create item');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <BaseModal title="Add Inventory Item" @close="emit('close')">
    <form class="flex flex-col gap-stack-sm" @submit.prevent="submit">
      <p v-if="error" class="bg-error-container text-on-error-container rounded-lg px-stack-sm py-base text-body-md">
        {{ error }}
      </p>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="inv-name">Name *</label>
        <input
          id="inv-name"
          v-model="form.name"
          type="text"
          required
          placeholder="e.g. Rice, Batteries, Milk"
          class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
        />
      </div>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="inv-desc">Description</label>
        <textarea
          id="inv-desc"
          v-model="form.description"
          rows="2"
          placeholder="Optional details about this item"
          class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md resize-none"
        ></textarea>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-stack-sm">
        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="inv-category">Category</label>
          <select
            id="inv-category"
            v-model="form.category"
            class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
          >
            <option value="">None</option>
            <option v-for="cat in CATEGORIES" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>

        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="inv-location">Location</label>
          <input
            id="inv-location"
            v-model="form.location"
            type="text"
            placeholder="e.g. Kitchen pantry"
            class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-stack-sm">
        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="inv-qty">Quantity</label>
          <input
            id="inv-qty"
            v-model.number="form.quantity"
            type="number"
            min="0"
            step="0.1"
            class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
          />
        </div>

        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="inv-unit">Unit</label>
          <input
            id="inv-unit"
            v-model="form.unit"
            type="text"
            placeholder="e.g. pcs, lbs, liters"
            class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
          />
        </div>

        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="inv-threshold">Min. Threshold</label>
          <input
            id="inv-threshold"
            v-model.number="form.minimumThreshold"
            type="number"
            min="0"
            step="0.1"
            class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-stack-sm">
        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="inv-price">Unit Price</label>
          <input
            id="inv-price"
            v-model="form.unitPrice"
            type="number"
            min="0"
            step="0.01"
            placeholder="e.g. 950.00"
            class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
          />
        </div>

        <div v-if="business.activeBusinesses.length" class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="inv-business">Business</label>
          <select
            id="inv-business"
            v-model="form.businessId"
            class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
          >
            <option value="">None</option>
            <option v-for="b in business.activeBusinesses" :key="b.id" :value="b.id">{{ b.name }}</option>
          </select>
        </div>
      </div>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="inv-notes">Notes</label>
        <textarea
          id="inv-notes"
          v-model="form.notes"
          rows="2"
          placeholder="Brand preference, where to buy, etc."
          class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md resize-none"
        ></textarea>
      </div>

      <div class="flex justify-end gap-stack-sm mt-base">
        <button
          type="button"
          class="py-stack-sm px-stack-lg rounded-full border border-secondary text-secondary font-label-md active:scale-95 transition-all"
          @click="emit('close')"
        >
          Cancel
        </button>
        <button
          type="submit"
          :disabled="saving"
          class="py-stack-sm px-stack-lg rounded-full bg-primary text-on-primary font-label-md shadow-md hover:bg-primary-container hover:text-on-primary-container active:scale-95 transition-all disabled:opacity-60"
        >
          {{ saving ? 'Adding…' : 'Add Item' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>
