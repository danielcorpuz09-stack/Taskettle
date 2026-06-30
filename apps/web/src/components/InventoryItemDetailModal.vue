<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import BaseModal from './BaseModal.vue';
import { useInventoryStore } from '@/stores/inventory';
import { useBoardStore } from '@/stores/board';
import { useBusinessStore } from '@/stores/business';
import { apiErrorMessage } from '@/lib/api';
import { toMinor } from '@/lib/money';
import type { InventoryItem } from '@/types';

const props = defineProps<{ item: InventoryItem }>();
const emit = defineEmits<{ (e: 'close'): void; (e: 'updated'): void }>();

const inventory = useInventoryStore();
const board = useBoardStore();
const business = useBusinessStore();

const CATEGORIES = ['Groceries', 'Household', 'Medicine', 'Tools', 'Electronics', 'School Supplies', 'DIY Materials', 'Pet Supplies'];

function majorOf(minor: number | null): string {
  return minor == null ? '' : (minor / 100).toFixed(2);
}

const form = reactive({
  name: props.item.name,
  description: props.item.description ?? '',
  category: props.item.category ?? '',
  quantity: props.item.quantity,
  unit: props.item.unit ?? '',
  minimumThreshold: props.item.minimumThreshold,
  location: props.item.location ?? '',
  unitPrice: majorOf(props.item.unitPriceMinor),
  businessId: props.item.businessId ?? '',
  notes: props.item.notes ?? '',
});
const error = ref('');
const saving = ref(false);
const deleting = ref(false);

onMounted(() => {
  if (board.currentCircleId && business.businesses.length === 0) {
    business.fetchBusinesses(board.currentCircleId).catch(() => {});
  }
});

watch(() => props.item, (i) => {
  form.name = i.name;
  form.description = i.description ?? '';
  form.category = i.category ?? '';
  form.quantity = i.quantity;
  form.unit = i.unit ?? '';
  form.minimumThreshold = i.minimumThreshold;
  form.location = i.location ?? '';
  form.unitPrice = majorOf(i.unitPriceMinor);
  form.businessId = i.businessId ?? '';
  form.notes = i.notes ?? '';
});

async function save() {
  error.value = '';
  saving.value = true;
  try {
    await inventory.updateItem(props.item.id, {
      name: form.name.trim(),
      description: form.description.trim() || null,
      category: form.category || null,
      quantity: form.quantity,
      unit: form.unit.trim() || null,
      minimumThreshold: form.minimumThreshold,
      location: form.location.trim() || null,
      unitPriceMinor: form.unitPrice ? toMinor(form.unitPrice) : null,
      businessId: form.businessId || null,
      notes: form.notes.trim() || null,
    } as any);
    emit('updated');
  } catch (err) {
    error.value = apiErrorMessage(err, 'Could not save changes');
  } finally {
    saving.value = false;
  }
}

async function remove() {
  if (!confirm('Delete this item? This cannot be undone.')) return;
  deleting.value = true;
  try {
    await inventory.deleteItem(props.item.id);
    emit('updated');
  } catch (err) {
    error.value = apiErrorMessage(err, 'Could not delete item');
  } finally {
    deleting.value = false;
  }
}

async function addToShoppingList() {
  try {
    await inventory.addToShoppingList(props.item.id);
    if (board.currentCircleId) await inventory.fetchShoppingList(board.currentCircleId);
    emit('updated');
  } catch (err) {
    error.value = apiErrorMessage(err, 'Could not add to shopping list');
  }
}

async function createTask() {
  try {
    await inventory.createTaskFromItem(props.item.id);
    emit('updated');
  } catch (err) {
    error.value = apiErrorMessage(err, 'Could not create task');
  }
}
</script>

<template>
  <BaseModal title="Item Details" @close="emit('close')">
    <form class="flex flex-col gap-stack-sm" @submit.prevent="save">
      <p v-if="error" class="bg-error-container text-on-error-container rounded-lg px-stack-sm py-base text-body-md">
        {{ error }}
      </p>

      <!-- Quick actions -->
      <div class="flex flex-wrap gap-2 pb-stack-sm border-b border-surface-container">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-label-md border border-secondary text-secondary hover:bg-secondary-container/40 transition-colors active:scale-95"
          @click="addToShoppingList"
        >
          <span class="material-symbols-outlined !text-[18px]">shopping_cart</span>
          Add to Shopping List
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-label-md border border-primary text-primary hover:bg-primary-container/40 transition-colors active:scale-95"
          @click="createTask"
        >
          <span class="material-symbols-outlined !text-[18px]">add_task</span>
          Create Task
        </button>
      </div>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="inv-d-name">Name</label>
        <input
          id="inv-d-name"
          v-model="form.name"
          type="text"
          required
          class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
        />
      </div>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="inv-d-desc">Description</label>
        <textarea
          id="inv-d-desc"
          v-model="form.description"
          rows="2"
          class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md resize-none"
        ></textarea>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-stack-sm">
        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="inv-d-category">Category</label>
          <select
            id="inv-d-category"
            v-model="form.category"
            class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
          >
            <option value="">None</option>
            <option v-for="cat in CATEGORIES" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>

        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="inv-d-location">Location</label>
          <input
            id="inv-d-location"
            v-model="form.location"
            type="text"
            class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-stack-sm">
        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="inv-d-qty">Quantity</label>
          <input
            id="inv-d-qty"
            v-model.number="form.quantity"
            type="number"
            min="0"
            step="0.1"
            class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
          />
        </div>

        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="inv-d-unit">Unit</label>
          <input
            id="inv-d-unit"
            v-model="form.unit"
            type="text"
            class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
          />
        </div>

        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="inv-d-threshold">Min. Threshold</label>
          <input
            id="inv-d-threshold"
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
          <label class="font-label-md text-label-md text-on-surface" for="inv-d-price">Unit Price</label>
          <input
            id="inv-d-price"
            v-model="form.unitPrice"
            type="number"
            min="0"
            step="0.01"
            class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
          />
        </div>

        <div v-if="business.activeBusinesses.length" class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="inv-d-business">Business</label>
          <select
            id="inv-d-business"
            v-model="form.businessId"
            class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
          >
            <option value="">None</option>
            <option v-for="b in business.activeBusinesses" :key="b.id" :value="b.id">{{ b.name }}</option>
          </select>
        </div>
      </div>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="inv-d-notes">Notes</label>
        <textarea
          id="inv-d-notes"
          v-model="form.notes"
          rows="2"
          class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md resize-none"
        ></textarea>
      </div>

      <div class="flex items-center justify-between gap-stack-sm mt-base">
        <button
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
          class="py-stack-sm px-stack-lg rounded-full bg-primary text-on-primary font-label-md shadow-md hover:bg-primary-container hover:text-on-primary-container active:scale-95 transition-all disabled:opacity-60"
        >
          {{ saving ? 'Saving…' : 'Save' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>
