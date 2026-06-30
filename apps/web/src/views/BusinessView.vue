<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useBoardStore } from '@/stores/board';
import { useBusinessStore } from '@/stores/business';
import { useWalletStore } from '@/stores/wallet';
import { apiErrorMessage } from '@/lib/api';
import CreateBusinessModal from '@/components/CreateBusinessModal.vue';

const router = useRouter();
const auth = useAuthStore();
const board = useBoardStore();
const business = useBusinessStore();
const wallet = useWalletStore();

const error = ref('');
const showCreate = ref(false);

const hasCircle = computed(() => Boolean(board.currentCircleId));

const TYPE_LABEL: Record<string, string> = {
  PRINTING_3D: '3D Printing',
  GENERAL: 'General',
};
const TYPE_ICON: Record<string, string> = {
  PRINTING_3D: 'print',
  GENERAL: 'storefront',
};

async function loadData(circleId: string) {
  try {
    await Promise.all([business.fetchBusinesses(circleId), wallet.fetchAccounts(circleId)]);
  } catch (err) {
    error.value = apiErrorMessage(err);
  }
}

watch(
  () => board.currentCircleId,
  async (id) => {
    if (id) await loadData(id);
  }
);

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

async function onCreated() {
  showCreate.value = false;
  if (board.currentCircleId) await loadData(board.currentCircleId);
}

function open(id: string) {
  router.push({ name: 'business-detail', params: { businessId: id } });
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-surface">
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
          <span class="hidden sm:inline">New Business</span>
        </button>
      </nav>
    </header>

    <main class="flex-1 pt-[72px] px-container-padding-mobile sm:px-container-padding-desktop max-w-[1120px] mx-auto w-full">
      <p v-if="error" class="mt-stack-sm bg-error-container text-on-error-container rounded-lg px-stack-sm py-base text-body-md">
        {{ error }}
      </p>

      <div v-if="!hasCircle" class="flex-1 flex flex-col items-center justify-center text-center gap-stack-sm py-stack-lg">
        <div class="w-20 h-20 bg-primary-container rounded-xl flex items-center justify-center">
          <span class="material-symbols-outlined text-on-primary-container !text-[44px]">storefront</span>
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
        <div class="flex items-center justify-between py-stack-sm flex-wrap gap-base">
          <h1 class="font-headline-lg text-headline-md sm:text-headline-lg text-on-surface flex items-center gap-2">
            <span class="material-symbols-outlined !text-[28px] text-primary">storefront</span>
            Business
          </h1>
        </div>

        <div v-if="business.businesses.length === 0" class="flex flex-col items-center justify-center text-center gap-stack-sm py-stack-lg">
          <span class="material-symbols-outlined !text-[48px] text-on-surface-variant">storefront</span>
          <p class="text-body-md text-on-surface-variant">No businesses yet. Create one to start tracking sales, expenses and prints.</p>
          <button
            class="mt-base bg-primary text-on-primary px-stack-lg py-stack-sm rounded-full font-label-md hover:opacity-90 active:scale-95 transition-all"
            @click="showCreate = true"
          >
            New Business
          </button>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-stack-sm pb-stack-md">
          <button
            v-for="b in business.businesses"
            :key="b.id"
            class="text-left bg-surface-container rounded-xl p-stack-md flex flex-col gap-base hover:bg-surface-container-high active:scale-[0.99] transition-all"
            @click="open(b.id)"
          >
            <div class="flex items-center gap-stack-sm">
              <div class="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center">
                <span class="material-symbols-outlined text-on-primary-container">{{ TYPE_ICON[b.type] ?? 'storefront' }}</span>
              </div>
              <div class="flex flex-col">
                <span class="font-label-lg text-label-lg text-on-surface">{{ b.name }}</span>
                <span class="text-body-sm text-on-surface-variant">{{ TYPE_LABEL[b.type] ?? b.type }} · {{ b.currency }}</span>
              </div>
            </div>
            <span v-if="b.archived" class="self-start text-label-sm bg-surface-container-high text-on-surface-variant rounded-full px-2 py-0.5">
              Archived
            </span>
          </button>
        </div>
      </template>
    </main>

    <CreateBusinessModal v-if="showCreate" @close="showCreate = false" @saved="onCreated" />
  </div>
</template>
