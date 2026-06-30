<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useBoardStore } from '@/stores/board';
import { useInventoryStore } from '@/stores/inventory';
import { useBusinessStore } from '@/stores/business';
import { apiErrorMessage } from '@/lib/api';
import InventoryDashboardCards from '@/components/InventoryDashboard.vue';
import InventoryItemCard from '@/components/InventoryItemCard.vue';
import CreateInventoryItemModal from '@/components/CreateInventoryItemModal.vue';
import InventoryItemDetailModal from '@/components/InventoryItemDetailModal.vue';
import ShoppingList from '@/components/ShoppingList.vue';
import type { InventoryItem } from '@/types';

const router = useRouter();
const auth = useAuthStore();
const board = useBoardStore();
const inventory = useInventoryStore();
const business = useBusinessStore();

const error = ref('');
const showCreate = ref(false);
const selectedItem = ref<InventoryItem | null>(null);

type TabId = 'inventory' | 'shopping';
const activeTab = ref<TabId>('inventory');

const hasCircle = computed(() => Boolean(board.currentCircleId));

const CATEGORIES = ['Groceries', 'Household', 'Medicine', 'Tools', 'Electronics', 'School Supplies', 'DIY Materials', 'Pet Supplies'];

const distinctLocations = computed(() =>
  [...new Set(inventory.items.map((i) => i.location).filter((l): l is string => Boolean(l)))].sort()
);

watch(() => board.currentCircleId, async (id) => {
  if (id) await loadData(id);
});

async function loadData(circleId: string) {
  try {
    await Promise.all([
      inventory.fetchItems(circleId),
      inventory.fetchDashboard(circleId),
      inventory.fetchShoppingList(circleId),
      business.fetchBusinesses(circleId),
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

async function onItemCreated() {
  showCreate.value = false;
  if (board.currentCircleId) {
    await Promise.all([
      inventory.fetchItems(board.currentCircleId),
      inventory.fetchDashboard(board.currentCircleId),
    ]);
  }
}

async function onItemUpdated() {
  selectedItem.value = null;
  if (board.currentCircleId) {
    await Promise.all([
      inventory.fetchItems(board.currentCircleId),
      inventory.fetchDashboard(board.currentCircleId),
      inventory.fetchShoppingList(board.currentCircleId),
    ]);
  }
}

function applyFilter(status: string) {
  inventory.filters.status = status;
  if (board.currentCircleId) inventory.fetchItems(board.currentCircleId);
}

function applyCategoryFilter(category: string) {
  inventory.filters.category = category;
  if (board.currentCircleId) inventory.fetchItems(board.currentCircleId);
}

function applyLocationFilter(location: string) {
  inventory.filters.location = location;
  if (board.currentCircleId) inventory.fetchItems(board.currentCircleId);
}

function applyBusinessFilter(businessId: string) {
  inventory.filters.businessId = businessId;
  if (board.currentCircleId) inventory.fetchItems(board.currentCircleId);
}

function clearFilters() {
  inventory.filters.status = '';
  inventory.filters.category = '';
  inventory.filters.search = '';
  inventory.filters.location = '';
  inventory.filters.businessId = '';
  if (board.currentCircleId) inventory.fetchItems(board.currentCircleId);
}

function onSearch(q: string) {
  inventory.filters.search = q;
  if (board.currentCircleId) inventory.fetchItems(board.currentCircleId);
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-surface">
    <!-- Top bar -->
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
          @click="showCreate = true"
        >
          <span class="material-symbols-outlined !text-[20px]">add</span>
          <span class="hidden sm:inline">Add Item</span>
        </button>
      </nav>
    </header>

    <main class="flex-1 pt-[72px] px-container-padding-mobile sm:px-container-padding-desktop max-w-[1120px] mx-auto w-full">
      <p v-if="error" class="mt-stack-sm bg-error-container text-on-error-container rounded-lg px-stack-sm py-base text-body-md">
        {{ error }}
      </p>

      <div v-if="!hasCircle" class="flex-1 flex flex-col items-center justify-center text-center gap-stack-sm py-stack-lg">
        <div class="w-20 h-20 bg-primary-container rounded-xl flex items-center justify-center">
          <span class="material-symbols-outlined text-on-primary-container !text-[44px]">inventory_2</span>
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
        <!-- Page title & tabs -->
        <div class="flex items-center justify-between py-stack-sm flex-wrap gap-base">
          <h1 class="font-headline-lg text-headline-md sm:text-headline-lg text-on-surface flex items-center gap-2">
            <span class="material-symbols-outlined !text-[28px] text-primary">inventory_2</span>
            Inventory
          </h1>
        </div>

        <!-- Tabs -->
        <div class="flex gap-1 border-b border-surface-container mb-stack-sm">
          <button
            class="px-4 py-2.5 text-label-md font-semibold transition-colors relative"
            :class="activeTab === 'inventory' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'"
            @click="activeTab = 'inventory'"
          >
            Items
            <span v-if="activeTab === 'inventory'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          </button>
          <button
            class="px-4 py-2.5 text-label-md font-semibold transition-colors relative"
            :class="activeTab === 'shopping' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'"
            @click="activeTab = 'shopping'"
          >
            Shopping List
            <span v-if="inventory.pendingShoppingItems.length" class="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-secondary text-on-secondary text-[11px] font-bold">
              {{ inventory.pendingShoppingItems.length }}
            </span>
            <span v-if="activeTab === 'shopping'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          </button>
        </div>

        <!-- Inventory tab -->
        <template v-if="activeTab === 'inventory'">
          <!-- Dashboard summary -->
          <InventoryDashboardCards
            v-if="inventory.dashboard"
            :dashboard="inventory.dashboard"
            @filter="applyFilter"
          />

          <!-- Search & filters -->
          <div class="flex flex-wrap items-center gap-2 py-stack-sm">
            <div class="relative flex-1 min-w-[180px] max-w-[320px]">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 !text-[20px] text-on-surface-variant">search</span>
              <input
                :value="inventory.filters.search"
                type="text"
                placeholder="Search items..."
                class="w-full pl-10 pr-3 py-2 rounded-full bg-surface-container border border-transparent text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                @input="onSearch(($event.target as HTMLInputElement).value)"
              />
            </div>
            <select
              :value="inventory.filters.category"
              class="rounded-full bg-surface-container border border-transparent py-2 px-3 text-body-md text-on-surface focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              @change="applyCategoryFilter(($event.target as HTMLSelectElement).value)"
            >
              <option value="">All categories</option>
              <option v-for="cat in CATEGORIES" :key="cat" :value="cat">{{ cat }}</option>
            </select>
            <select
              :value="inventory.filters.status"
              class="rounded-full bg-surface-container border border-transparent py-2 px-3 text-body-md text-on-surface focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              @change="applyFilter(($event.target as HTMLSelectElement).value)"
            >
              <option value="">All statuses</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
            <select
              v-if="distinctLocations.length"
              :value="inventory.filters.location"
              class="rounded-full bg-surface-container border border-transparent py-2 px-3 text-body-md text-on-surface focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              @change="applyLocationFilter(($event.target as HTMLSelectElement).value)"
            >
              <option value="">All locations</option>
              <option v-for="loc in distinctLocations" :key="loc" :value="loc">{{ loc }}</option>
            </select>
            <select
              v-if="business.activeBusinesses.length"
              :value="inventory.filters.businessId"
              class="rounded-full bg-surface-container border border-transparent py-2 px-3 text-body-md text-on-surface focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              @change="applyBusinessFilter(($event.target as HTMLSelectElement).value)"
            >
              <option value="">All businesses</option>
              <option v-for="b in business.activeBusinesses" :key="b.id" :value="b.id">{{ b.name }}</option>
            </select>
            <button
              v-if="inventory.filters.status || inventory.filters.category || inventory.filters.search || inventory.filters.location || inventory.filters.businessId"
              class="flex items-center gap-1 text-body-sm text-on-surface-variant hover:text-error transition-colors"
              @click="clearFilters"
            >
              <span class="material-symbols-outlined !text-[16px]">close</span>
              Clear
            </button>
          </div>

          <!-- Items grid -->
          <div v-if="inventory.loading" class="flex items-center justify-center py-stack-lg">
            <span class="material-symbols-outlined animate-spin !text-[32px] text-on-surface-variant">progress_activity</span>
          </div>
          <div v-else-if="inventory.items.length === 0" class="flex flex-col items-center justify-center text-center gap-stack-sm py-stack-lg">
            <span class="material-symbols-outlined !text-[48px] text-on-surface-variant">inventory_2</span>
            <p class="text-body-md text-on-surface-variant">No items found. Add your first inventory item!</p>
          </div>
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-stack-sm pb-stack-md">
            <InventoryItemCard
              v-for="item in inventory.items"
              :key="item.id"
              :item="item"
              @click="selectedItem = item"
            />
          </div>
        </template>

        <!-- Shopping list tab -->
        <template v-if="activeTab === 'shopping'">
          <ShoppingList />
        </template>
      </template>
    </main>

    <!-- Modals -->
    <CreateInventoryItemModal v-if="showCreate" @close="showCreate = false" @created="onItemCreated" />
    <InventoryItemDetailModal v-if="selectedItem" :item="selectedItem" @close="selectedItem = null" @updated="onItemUpdated" />
  </div>
</template>
