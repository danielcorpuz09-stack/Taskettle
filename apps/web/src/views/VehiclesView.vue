<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useBoardStore } from '@/stores/board';
import { useVehiclesStore } from '@/stores/vehicles';
import { apiErrorMessage } from '@/lib/api';
import CreateVehicleModal from '@/components/CreateVehicleModal.vue';
import type { Vehicle } from '@/types';

const router = useRouter();
const board = useBoardStore();
const vehicles = useVehiclesStore();

const error = ref('');
const showCreate = ref(false);
const editingVehicle = ref<Vehicle | null>(null);

onMounted(async () => {
  try {
    if (board.currentCircleId) {
      await vehicles.fetchVehicles(board.currentCircleId);
    }
  } catch (err) {
    error.value = apiErrorMessage(err);
  }
});

function goBack() {
  router.push({ name: 'board' });
}

function isExpiring(date: string | null): boolean {
  if (!date) return false;
  const expiry = new Date(date);
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  return expiry <= thirtyDaysFromNow && expiry > new Date();
}

function isOverdue(date: string | null): boolean {
  if (!date) return false;
  return new Date(date) < new Date();
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
          <span class="font-headline-xl text-headline-md sm:text-headline-xl text-primary">Vehicles</span>
        </div>

        <div class="flex items-center gap-base">
          <button
            class="bg-primary text-on-primary px-stack-sm sm:px-stack-md py-2 rounded-full font-label-md flex items-center gap-base hover:opacity-90 active:scale-95 transition-all"
            @click="showCreate = true"
          >
            <span class="material-symbols-outlined !text-[20px]">add</span>
            <span class="hidden sm:inline">Add Vehicle</span>
          </button>
        </div>
      </nav>
    </header>

    <main class="flex-1 pt-[72px] px-container-padding-mobile sm:px-container-padding-desktop py-stack-sm max-w-[1440px] mx-auto w-full">
      <p v-if="error" class="mb-stack-sm bg-error-container text-on-error-container rounded-lg px-stack-sm py-base text-body-md">
        {{ error }}
      </p>

      <div v-if="vehicles.loading" class="flex items-center justify-center py-stack-lg">
        <span class="text-on-surface-variant">Loading vehicles...</span>
      </div>

      <div v-else-if="vehicles.vehicles.length === 0" class="text-center py-stack-lg">
        <p class="text-on-surface-variant text-body-md">No vehicles yet.</p>
      </div>

      <div v-else class="space-y-base">
        <div
          v-for="vehicle in vehicles.vehicles"
          :key="vehicle.id"
          class="bg-surface-container rounded-lg p-stack-sm border border-surface-container hover:border-primary transition-colors cursor-pointer"
          :class="{
            'border-error': vehicles.overdue.includes(vehicle),
            'border-warning': vehicles.registrationExpiring.includes(vehicle) || vehicles.insuranceExpiring.includes(vehicle),
          }"
          @click="editingVehicle = vehicle"
        >
          <div class="flex justify-between items-start gap-base">
            <div>
              <h3 class="font-label-lg text-on-surface">{{ vehicle.name }}</h3>
              <p v-if="vehicle.model" class="text-label-sm text-on-surface-variant">{{ vehicle.model }}</p>
              <p v-if="vehicle.plateNumber" class="text-label-sm text-on-surface-variant">{{ vehicle.plateNumber }}</p>
            </div>
          </div>

          <div v-if="vehicle.registrationExpiry || vehicle.insuranceExpiry" class="mt-stack-sm space-y-1 text-label-sm">
            <p v-if="vehicle.registrationExpiry" :class="isOverdue(vehicle.registrationExpiry) ? 'text-error' : isExpiring(vehicle.registrationExpiry) ? 'text-warning' : 'text-on-surface-variant'">
              Registration: {{ new Date(vehicle.registrationExpiry).toLocaleDateString() }}
            </p>
            <p v-if="vehicle.insuranceExpiry" :class="isOverdue(vehicle.insuranceExpiry) ? 'text-error' : isExpiring(vehicle.insuranceExpiry) ? 'text-warning' : 'text-on-surface-variant'">
              Insurance: {{ new Date(vehicle.insuranceExpiry).toLocaleDateString() }}
            </p>
          </div>
        </div>
      </div>
    </main>

    <CreateVehicleModal
      v-if="showCreate || editingVehicle"
      :vehicle="editingVehicle"
      @close="
        showCreate = false;
        editingVehicle = null;
      "
    />
  </div>
</template>
