<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import BaseModal from './BaseModal.vue';
import { useAssetsStore } from '@/stores/assets';
import { useBoardStore } from '@/stores/board';
import { apiErrorMessage } from '@/lib/api';
import type { HomeAsset, HomeAssetCategory } from '@/types';

const props = defineProps<{
  asset?: HomeAsset | null;
}>();
const emit = defineEmits<{ (e: 'close'): void }>();

const board = useBoardStore();
const assets = useAssetsStore();

const CATEGORIES: HomeAssetCategory[] = ['APPLIANCE', 'ELECTRONICS', 'FURNITURE', 'POWER_TOOL', 'OTHER'];

const form = reactive({
  name: '',
  category: 'OTHER' as HomeAssetCategory,
  purchaseDate: '',
  warrantyExpiration: '',
  serialNumber: '',
  currentValue: '',
  notes: '',
});

const error = ref('');
const saving = ref(false);
const deleting = ref(false);
const isEditing = computed(() => !!props.asset);

// Reset form when asset prop changes
watch(
  () => props.asset,
  (asset) => {
    if (asset) {
      form.name = asset.name;
      form.category = asset.category;
      form.purchaseDate = asset.purchaseDate ? asset.purchaseDate.split('T')[0] : '';
      form.warrantyExpiration = asset.warrantyExpiration ? asset.warrantyExpiration.split('T')[0] : '';
      form.serialNumber = asset.serialNumber ?? '';
      form.currentValue = asset.currentValue ? String(asset.currentValue) : '';
      form.notes = asset.notes ?? '';
    } else {
      form.name = '';
      form.category = 'OTHER';
      form.purchaseDate = '';
      form.warrantyExpiration = '';
      form.serialNumber = '';
      form.currentValue = '';
      form.notes = '';
    }
  },
  { immediate: true }
);

async function save() {
  if (!form.name.trim()) {
    error.value = 'Asset name is required';
    return;
  }

  error.value = '';
  saving.value = true;
  try {
    const payload = {
      name: form.name.trim(),
      category: form.category,
      purchaseDate: form.purchaseDate || undefined,
      warrantyExpiration: form.warrantyExpiration || undefined,
      serialNumber: form.serialNumber || undefined,
      currentValue: form.currentValue ? Number(form.currentValue) : undefined,
      notes: form.notes || undefined,
    };

    if (isEditing.value && props.asset) {
      await assets.updateAsset(props.asset.id, payload);
    } else {
      if (!board.currentCircleId) return;
      await assets.createAsset(board.currentCircleId, payload);
    }
    emit('close');
  } catch (err) {
    error.value = apiErrorMessage(err, isEditing.value ? 'Could not save changes' : 'Could not create asset');
  } finally {
    saving.value = false;
  }
}

async function remove() {
  if (!props.asset) return;
  if (!confirm('Delete this asset? This cannot be undone.')) return;

  deleting.value = true;
  try {
    await assets.deleteAsset(props.asset.id);
    emit('close');
  } catch (err) {
    error.value = apiErrorMessage(err, 'Could not delete asset');
  } finally {
    deleting.value = false;
  }
}
</script>

<template>
  <BaseModal :title="isEditing ? 'Edit asset' : 'New asset'" @close="emit('close')">
    <form class="flex flex-col gap-stack-sm" @submit.prevent="save">
      <p v-if="error" class="bg-error-container text-on-error-container rounded-lg px-stack-sm py-base text-body-md">
        {{ error }}
      </p>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="asset-name">Name</label>
        <input
          id="asset-name"
          v-model="form.name"
          type="text"
          required
          placeholder="e.g., Kitchen Refrigerator"
          class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
        />
      </div>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="asset-category">Category</label>
        <select
          id="asset-category"
          v-model="form.category"
          class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
        >
          <option v-for="cat in CATEGORIES" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-stack-sm">
        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="asset-purchase">Purchase Date</label>
          <input
            id="asset-purchase"
            v-model="form.purchaseDate"
            type="date"
            class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
          />
        </div>

        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="asset-warranty">Warranty Expires</label>
          <input
            id="asset-warranty"
            v-model="form.warrantyExpiration"
            type="date"
            class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-stack-sm">
        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="asset-serial">Serial Number</label>
          <input
            id="asset-serial"
            v-model="form.serialNumber"
            type="text"
            placeholder="Optional"
            class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
          />
        </div>

        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="asset-value">Current Value</label>
          <input
            id="asset-value"
            v-model="form.currentValue"
            type="number"
            step="0.01"
            placeholder="Optional"
            class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
          />
        </div>
      </div>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="asset-notes">Notes</label>
        <textarea
          id="asset-notes"
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
