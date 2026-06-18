<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAssetsStore } from '@/stores/assets';
import { useBoardStore } from '@/stores/board';
import { apiErrorMessage } from '@/lib/api';
import CreateAssetModal from '@/components/CreateAssetModal.vue';
import type { HomeAsset } from '@/types';

const router = useRouter();
const board = useBoardStore();
const assets = useAssetsStore();

const error = ref('');
const showCreate = ref(false);
const editingAsset = ref<HomeAsset | null>(null);

onMounted(async () => {
  try {
    if (board.currentCircleId) {
      await assets.fetchAssets(board.currentCircleId);
    }
  } catch (err) {
    error.value = apiErrorMessage(err);
  }
});

function goBack() {
  router.push({ name: 'board' });
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- Header -->
    <header class="bg-surface fixed top-0 w-full z-40 border-b border-surface-container">
      <nav class="flex justify-between items-center w-full px-container-padding-mobile sm:px-container-padding-desktop py-stack-sm max-w-[1440px] mx-auto gap-base">
        <div class="flex items-center gap-stack-sm">
          <button
            class="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container transition-colors"
            @click="goBack"
          >
            <span class="material-symbols-outlined text-on-surface">arrow_back</span>
          </button>
          <span class="font-headline-xl text-headline-md sm:text-headline-xl text-primary">Home Assets</span>
        </div>

        <div class="flex items-center gap-base">
          <button
            class="bg-primary text-on-primary px-stack-sm sm:px-stack-md py-2 rounded-full font-label-md flex items-center gap-base hover:opacity-90 active:scale-95 transition-all"
            @click="showCreate = true"
          >
            <span class="material-symbols-outlined !text-[20px]">add</span>
            <span class="hidden sm:inline">Add Asset</span>
          </button>
        </div>
      </nav>
    </header>

    <main class="flex-1 pt-[72px] px-container-padding-mobile sm:px-container-padding-desktop py-stack-sm max-w-[1440px] mx-auto w-full">
      <p v-if="error" class="mb-stack-sm bg-error-container text-on-error-container rounded-lg px-stack-sm py-base text-body-md">
        {{ error }}
      </p>

      <div v-if="assets.loading" class="flex items-center justify-center py-stack-lg">
        <span class="text-on-surface-variant">Loading assets...</span>
      </div>

      <div v-else-if="assets.assets.length === 0" class="text-center py-stack-lg">
        <p class="text-on-surface-variant text-body-md">No assets yet. Create one to get started!</p>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-base">
        <div
          v-for="asset in assets.assets"
          :key="asset.id"
          class="bg-surface-container rounded-lg p-stack-sm border border-surface-container hover:border-primary transition-colors cursor-pointer"
          @click="editingAsset = asset"
        >
          <h3 class="font-label-lg text-on-surface">{{ asset.name }}</h3>
          <p class="text-label-sm text-on-surface-variant">{{ asset.category }}</p>
          <p v-if="asset.warrantyExpiration" class="text-body-sm text-on-surface-variant mt-base">
            Warranty expires: {{ new Date(asset.warrantyExpiration).toLocaleDateString() }}
          </p>
        </div>
      </div>
    </main>

    <CreateAssetModal
      v-if="showCreate || editingAsset"
      :asset="editingAsset"
      @close="
        showCreate = false;
        editingAsset = null;
      "
    />
  </div>
</template>
