<script setup lang="ts">
import { reactive, ref } from 'vue';
import BaseModal from './BaseModal.vue';
import { useBoardStore } from '@/stores/board';
import { apiErrorMessage } from '@/lib/api';

const board = useBoardStore();
const emit = defineEmits<{ (e: 'close'): void }>();

const form = reactive({
  name: board.currentCircle?.name ?? '',
  icon: board.currentCircle?.icon ?? 'family_history',
});
const error = ref('');
const saving = ref(false);
const confirming = ref(false);

async function submit() {
  if (!form.name.trim()) return;
  error.value = '';
  saving.value = true;
  try {
    if (!board.currentCircleId) return;
    await board.updateCircle(board.currentCircleId, {
      name: form.name.trim(),
      icon: form.icon.trim(),
    });
    emit('close');
  } catch (err) {
    error.value = apiErrorMessage(err, 'Could not update circle');
  } finally {
    saving.value = false;
  }
}

async function deleteCircle() {
  error.value = '';
  saving.value = true;
  try {
    if (!board.currentCircleId) return;
    await board.archiveCircle(board.currentCircleId);
    emit('close');
  } catch (err) {
    error.value = apiErrorMessage(err, 'Could not delete circle');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <BaseModal title="Circle settings" @close="emit('close')">
    <div v-if="confirming" class="flex flex-col gap-stack-md">
      <p class="text-body-md text-on-surface">
        Are you sure you want to delete <strong>{{ form.name }}</strong>? This cannot be undone.
      </p>
      <div class="flex gap-stack-sm">
        <button
          type="button"
          class="flex-1 py-stack-sm rounded-full border border-secondary text-secondary font-label-md hover:bg-secondary-container/40 active:scale-95 transition-all"
          @click="confirming = false"
        >
          Cancel
        </button>
        <button
          type="button"
          :disabled="saving"
          class="flex-1 py-stack-sm rounded-full bg-error text-on-error font-label-md shadow-md hover:bg-error-container hover:text-on-error-container active:scale-95 transition-all disabled:opacity-60"
          @click="deleteCircle"
        >
          {{ saving ? 'Deleting…' : 'Delete' }}
        </button>
      </div>
    </div>

    <form v-else class="flex flex-col gap-stack-sm" @submit.prevent="submit">
      <p
        v-if="error"
        class="bg-error-container text-on-error-container rounded-lg px-stack-sm py-base text-body-md"
      >
        {{ error }}
      </p>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="name">Circle name</label>
        <input
          id="name"
          v-model="form.name"
          type="text"
          required
          placeholder="Family…"
          class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
        />
      </div>

      <div class="flex flex-col gap-base">
        <label class="font-label-md text-label-md text-on-surface" for="icon">Icon (Material Symbols)</label>
        <input
          id="icon"
          v-model="form.icon"
          type="text"
          placeholder="family_history"
          class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
        />
        <p class="text-label-md text-on-surface-variant">Preview: <span class="material-symbols-outlined">{{ form.icon }}</span></p>
      </div>

      <div class="flex gap-stack-sm mt-base">
        <button
          type="button"
          class="flex-1 py-stack-sm rounded-full border border-secondary text-secondary font-label-md hover:bg-secondary-container/40 active:scale-95 transition-all"
          @click="emit('close')"
        >
          Cancel
        </button>
        <button
          type="submit"
          :disabled="saving"
          class="flex-1 py-stack-sm rounded-full bg-primary text-on-primary font-label-md shadow-md hover:bg-primary-container hover:text-on-primary-container active:scale-95 transition-all disabled:opacity-60"
        >
          {{ saving ? 'Saving…' : 'Save' }}
        </button>
      </div>

      <button
        v-if="board.isCircleOwner"
        type="button"
        class="w-full py-stack-sm rounded-full border border-error text-error font-label-md hover:bg-error-container/40 active:scale-95 transition-all"
        @click="confirming = true"
      >
        Delete circle
      </button>
    </form>
  </BaseModal>
</template>
