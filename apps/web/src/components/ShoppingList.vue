<script setup lang="ts">
import { ref } from 'vue';
import { useInventoryStore } from '@/stores/inventory';
import { useBoardStore } from '@/stores/board';
import { apiErrorMessage } from '@/lib/api';

const inventory = useInventoryStore();
const board = useBoardStore();

const newItemName = ref('');
const newItemQty = ref(1);
const error = ref('');

async function addItem() {
  if (!newItemName.value.trim() || !board.currentCircleId) return;
  error.value = '';
  try {
    await inventory.addShoppingItem(board.currentCircleId, {
      name: newItemName.value.trim(),
      quantityNeeded: newItemQty.value,
    });
    newItemName.value = '';
    newItemQty.value = 1;
  } catch (err) {
    error.value = apiErrorMessage(err, 'Could not add item');
  }
}

async function togglePurchased(itemId: string, currentStatus: string) {
  try {
    if (currentStatus === 'PENDING') {
      await inventory.markPurchased(itemId);
    } else {
      await inventory.markPending(itemId);
    }
  } catch (err) {
    error.value = apiErrorMessage(err);
  }
}

async function removeItem(itemId: string) {
  try {
    await inventory.removeShoppingItem(itemId);
  } catch (err) {
    error.value = apiErrorMessage(err);
  }
}
</script>

<template>
  <div class="flex flex-col gap-stack-sm">
    <p v-if="error" class="bg-error-container text-on-error-container rounded-lg px-stack-sm py-base text-body-md">
      {{ error }}
    </p>

    <!-- Quick add form -->
    <form class="flex items-center gap-2" @submit.prevent="addItem">
      <div class="relative flex-1">
        <input
          v-model="newItemName"
          type="text"
          placeholder="Add an item..."
          class="w-full px-stack-sm py-2.5 bg-surface-container-lowest rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
        />
      </div>
      <input
        v-model.number="newItemQty"
        type="number"
        min="1"
        step="1"
        class="w-16 px-2 py-2.5 bg-surface-container-lowest rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-body-md text-center"
      />
      <button
        type="submit"
        :disabled="!newItemName.trim()"
        class="p-2.5 rounded-full bg-primary text-on-primary hover:opacity-90 active:scale-95 transition-all disabled:opacity-40"
      >
        <span class="material-symbols-outlined !text-[20px]">add</span>
      </button>
    </form>

    <!-- Pending items -->
    <div v-if="inventory.pendingShoppingItems.length > 0">
      <p class="text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold mb-2">
        To Buy ({{ inventory.pendingShoppingItems.length }})
      </p>
      <ul class="flex flex-col gap-1">
        <li
          v-for="item in inventory.pendingShoppingItems"
          :key="item.id"
          class="flex items-center gap-3 px-stack-sm py-2.5 bg-surface-container-lowest rounded-lg border border-surface-container hover:border-outline-variant transition-colors group"
        >
          <button
            class="w-6 h-6 rounded-full border-2 border-outline-variant flex items-center justify-center hover:border-primary hover:bg-primary-container/30 transition-colors shrink-0"
            @click="togglePurchased(item.id, item.status)"
          >
          </button>
          <div class="flex-1 min-w-0">
            <p class="text-body-md text-on-surface truncate">{{ item.name }}</p>
            <p class="text-body-sm text-on-surface-variant">
              {{ item.quantityNeeded }} {{ item.unit || 'pcs' }}
            </p>
          </div>
          <button
            class="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-error-container/40 text-on-surface-variant hover:text-error transition-all"
            @click="removeItem(item.id)"
          >
            <span class="material-symbols-outlined !text-[18px]">close</span>
          </button>
        </li>
      </ul>
    </div>

    <!-- Purchased items -->
    <div v-if="inventory.purchasedShoppingItems.length > 0">
      <p class="text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold mb-2 mt-stack-sm">
        Purchased ({{ inventory.purchasedShoppingItems.length }})
      </p>
      <ul class="flex flex-col gap-1">
        <li
          v-for="item in inventory.purchasedShoppingItems"
          :key="item.id"
          class="flex items-center gap-3 px-stack-sm py-2.5 bg-surface-container-lowest rounded-lg border border-surface-container opacity-70 group"
        >
          <button
            class="w-6 h-6 rounded-full border-2 border-primary bg-primary flex items-center justify-center shrink-0"
            @click="togglePurchased(item.id, item.status)"
          >
            <span class="material-symbols-outlined text-on-primary !text-[16px]">check</span>
          </button>
          <div class="flex-1 min-w-0">
            <p class="text-body-md text-on-surface line-through truncate">{{ item.name }}</p>
            <p class="text-body-sm text-on-surface-variant">
              {{ item.quantityNeeded }} {{ item.unit || 'pcs' }}
            </p>
          </div>
          <button
            class="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-error-container/40 text-on-surface-variant hover:text-error transition-all"
            @click="removeItem(item.id)"
          >
            <span class="material-symbols-outlined !text-[18px]">close</span>
          </button>
        </li>
      </ul>
    </div>

    <!-- Empty state -->
    <div v-if="inventory.shoppingList.length === 0" class="flex flex-col items-center justify-center text-center gap-2 py-stack-lg">
      <span class="material-symbols-outlined !text-[48px] text-on-surface-variant">shopping_cart</span>
      <p class="text-body-md text-on-surface-variant">Your shopping list is empty.</p>
      <p class="text-body-sm text-on-surface-variant">Add items manually or from your inventory.</p>
    </div>
  </div>
</template>
