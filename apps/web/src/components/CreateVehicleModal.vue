<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import BaseModal from './BaseModal.vue';
import { useVehiclesStore } from '@/stores/vehicles';
import { useBoardStore } from '@/stores/board';
import { apiErrorMessage } from '@/lib/api';
import type { Vehicle } from '@/types';

const props = defineProps<{
  vehicle?: Vehicle | null;
}>();
const emit = defineEmits<{ (e: 'close'): void }>();

const board = useBoardStore();
const vehicles = useVehiclesStore();

const form = reactive({
  name: '',
  model: '',
  plateNumber: '',
  registrationExpiry: '',
  insuranceExpiry: '',
  notes: '',
});

const error = ref('');
const saving = ref(false);
const deleting = ref(false);
const isEditing = computed(() => !!props.vehicle);

// Reset form when vehicle prop changes
watch(
  () => props.vehicle,
  (vehicle) => {
    if (vehicle) {
      form.name = vehicle.name;
      form.model = vehicle.model ?? '';
      form.plateNumber = vehicle.plateNumber ?? '';
      form.registrationExpiry = vehicle.registrationExpiry ? vehicle.registrationExpiry.split('T')[0] : '';
      form.insuranceExpiry = vehicle.insuranceExpiry ? vehicle.insuranceExpiry.split('T')[0] : '';
      form.notes = vehicle.notes ?? '';
    } else {
      form.name = '';
      form.model = '';
      form.plateNumber = '';
      form.registrationExpiry = '';
      form.insuranceExpiry = '';
      form.notes = '';
    }
  },
  { immediate: true }
);

async function save() {
  if (!form.name.trim()) {
    error.value = 'Vehicle name is required';
    return;
  }

  error.value = '';
  saving.value = true;
  try {
    const payload = {
      name: form.name.trim(),
      model: form.model || undefined,
      plateNumber: form.plateNumber || undefined,
      registrationExpiry: form.registrationExpiry || undefined,
      insuranceExpiry: form.insuranceExpiry || undefined,
      notes: form.notes || undefined,
    };

    if (isEditing.value && props.vehicle) {
      await vehicles.updateVehicle(props.vehicle.id, payload);
    } else {
      if (!board.currentCircleId) return;
      await vehicles.createVehicle(board.currentCircleId, payload);
    }
    emit('close');
  } catch (err) {
    error.value = apiErrorMessage(err, isEditing.value ? 'Could not save changes' : 'Could not create vehicle');
  } finally {
    saving.value = false;
  }
}

async function remove() {
  if (!props.vehicle) return;
  if (!confirm('Delete this vehicle? This cannot be undone.')) return;

  deleting.value = true;
  try {
    await vehicles.deleteVehicle(props.vehicle.id);
    emit('close');
  } catch (err) {
    error.value = apiErrorMessage(err, 'Could not delete vehicle');
  } finally {
    deleting.value = false;
  }
}
</script>

<template>
  <BaseModal :title="isEditing ? 'Edit vehicle' : 'New vehicle'" @close="emit('close')">
    <form class="flex flex-col gap-stack-sm" @submit.prevent="save">
      <p v-if="error" class="bg-error-container text-on-error-container rounded-lg px-stack-sm py-base text-body-md">
        {{ error }}
      </p>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="vehicle-name">Name</label>
        <input
          id="vehicle-name"
          v-model="form.name"
          type="text"
          required
          placeholder="e.g., Family Car"
          class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
        />
      </div>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="vehicle-model">Model</label>
        <input
          id="vehicle-model"
          v-model="form.model"
          type="text"
          placeholder="e.g., Honda Civic 2020"
          class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
        />
      </div>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="vehicle-plate">Plate Number</label>
        <input
          id="vehicle-plate"
          v-model="form.plateNumber"
          type="text"
          placeholder="Optional"
          class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
        />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-stack-sm">
        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="vehicle-reg">Registration Expires</label>
          <input
            id="vehicle-reg"
            v-model="form.registrationExpiry"
            type="date"
            class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
          />
        </div>

        <div class="flex flex-col gap-base">
          <label class="font-label-md text-label-md text-on-surface" for="vehicle-insurance">Insurance Expires</label>
          <input
            id="vehicle-insurance"
            v-model="form.insuranceExpiry"
            type="date"
            class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
          />
        </div>
      </div>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="vehicle-notes">Notes</label>
        <textarea
          id="vehicle-notes"
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
