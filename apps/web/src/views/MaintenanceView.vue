<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useBoardStore } from '@/stores/board';
import { useMaintenanceStore } from '@/stores/maintenance';
import { apiErrorMessage } from '@/lib/api';
import CreateMaintenanceModal from '@/components/CreateMaintenanceModal.vue';
import type { MaintenanceSchedule } from '@/types';

const router = useRouter();
const board = useBoardStore();
const maintenance = useMaintenanceStore();

const error = ref('');
const showCreate = ref(false);
const editingSchedule = ref<MaintenanceSchedule | null>(null);

onMounted(async () => {
  try {
    if (board.currentCircleId) {
      await maintenance.fetchSchedules(board.currentCircleId);
    }
  } catch (err) {
    error.value = apiErrorMessage(err);
  }
});

function goBack() {
  router.push({ name: 'board' });
}

function isOverdue(date: string): boolean {
  return new Date(date) < new Date();
}

function isDueSoon(date: string): boolean {
  const dueDate = new Date(date);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 7);
  return dueDate >= new Date() && dueDate <= tomorrow;
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
          <span class="font-headline-xl text-headline-md sm:text-headline-xl text-primary">Home Maintenance</span>
        </div>

        <div class="flex items-center gap-base">
          <button
            class="bg-primary text-on-primary px-stack-sm sm:px-stack-md py-2 rounded-full font-label-md flex items-center gap-base hover:opacity-90 active:scale-95 transition-all"
            @click="showCreate = true"
          >
            <span class="material-symbols-outlined !text-[20px]">add</span>
            <span class="hidden sm:inline">Add Schedule</span>
          </button>
        </div>
      </nav>
    </header>

    <main class="flex-1 pt-[72px] px-container-padding-mobile sm:px-container-padding-desktop py-stack-sm max-w-[1440px] mx-auto w-full">
      <p v-if="error" class="mb-stack-sm bg-error-container text-on-error-container rounded-lg px-stack-sm py-base text-body-md">
        {{ error }}
      </p>

      <div v-if="maintenance.loading" class="flex items-center justify-center py-stack-lg">
        <span class="text-on-surface-variant">Loading maintenance schedules...</span>
      </div>

      <div v-else-if="maintenance.schedules.length === 0" class="text-center py-stack-lg">
        <p class="text-on-surface-variant text-body-md">No maintenance schedules yet.</p>
      </div>

      <div v-else class="space-y-base">
        <!-- Overdue -->
        <div v-if="maintenance.overdue.length > 0">
          <h3 class="font-headline-sm text-error mb-base">Overdue</h3>
          <div class="space-y-base">
            <div
              v-for="schedule in maintenance.overdue"
              :key="schedule.id"
              class="bg-error-container rounded-lg p-stack-sm border border-error cursor-pointer hover:opacity-90 transition-all"
              @click="editingSchedule = schedule"
            >
              <h4 class="font-label-lg text-on-error-container">{{ schedule.title }}</h4>
              <p class="text-label-sm text-on-error-container">Due: {{ new Date(schedule.nextDueDate).toLocaleDateString() }}</p>
              <p v-if="schedule.description" class="text-body-sm text-on-error-container mt-base">{{ schedule.description }}</p>
            </div>
          </div>
        </div>

        <!-- Due Soon -->
        <div v-if="maintenance.dueSoon.length > 0">
          <h3 class="font-headline-sm text-warning mb-base">Due Soon</h3>
          <div class="space-y-base">
            <div
              v-for="schedule in maintenance.dueSoon"
              :key="schedule.id"
              class="bg-surface-container rounded-lg p-stack-sm border border-warning cursor-pointer hover:opacity-90 transition-all"
              @click="editingSchedule = schedule"
            >
              <h4 class="font-label-lg text-on-surface">{{ schedule.title }}</h4>
              <p class="text-label-sm text-on-surface-variant">Due: {{ new Date(schedule.nextDueDate).toLocaleDateString() }}</p>
              <p v-if="schedule.description" class="text-body-sm text-on-surface-variant mt-base">{{ schedule.description }}</p>
            </div>
          </div>
        </div>

        <!-- Upcoming -->
        <div v-if="maintenance.upcomingSchedules.filter(s => !isOverdue(s.nextDueDate) && !isDueSoon(s.nextDueDate)).length > 0">
          <h3 class="font-headline-sm text-on-surface mb-base">Upcoming</h3>
          <div class="space-y-base">
            <div
              v-for="schedule in maintenance.upcomingSchedules.filter(s => !isOverdue(s.nextDueDate) && !isDueSoon(s.nextDueDate))"
              :key="schedule.id"
              class="bg-surface-container rounded-lg p-stack-sm border border-surface-container hover:border-primary transition-colors cursor-pointer"
              @click="editingSchedule = schedule"
            >
              <h4 class="font-label-lg text-on-surface">{{ schedule.title }}</h4>
              <p class="text-label-sm text-on-surface-variant">Due: {{ new Date(schedule.nextDueDate).toLocaleDateString() }} · {{ schedule.frequency }}</p>
              <p v-if="schedule.description" class="text-body-sm text-on-surface-variant mt-base">{{ schedule.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </main>

    <CreateMaintenanceModal
      v-if="showCreate || editingSchedule"
      :schedule="editingSchedule"
      @close="
        showCreate = false;
        editingSchedule = null;
      "
    />
  </div>
</template>
