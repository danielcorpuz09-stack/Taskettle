<script setup lang="ts">
import { computed, ref } from 'vue';
import BaseModal from './BaseModal.vue';
import { api, apiErrorMessage } from '@/lib/api';
import { useBoardStore } from '@/stores/board';

const board = useBoardStore();
const emit = defineEmits<{ (e: 'close'): void }>();

const email = ref('');
const error = ref('');
const sending = ref(false);
const inviteLink = ref('');

const circleId = computed(() => board.currentCircleId);

async function send() {
  if (!email.value.trim() || !circleId.value) return;
  error.value = '';
  sending.value = true;
  try {
    const { data } = await api.post<{ invite: { token: string } }>(
      `/circles/${circleId.value}/invites`,
      { email: email.value.trim() }
    );
    inviteLink.value = `${window.location.origin}/invite/${data.invite.token}`;
  } catch (err) {
    error.value = apiErrorMessage(err, 'Could not send invite');
  } finally {
    sending.value = false;
  }
}

async function copyLink() {
  await navigator.clipboard.writeText(inviteLink.value);
}
</script>

<template>
  <BaseModal title="Invite a member" @close="emit('close')">
    <div class="flex flex-col gap-stack-sm">
      <p class="text-body-md text-on-surface-variant">
        Send an invite link to add someone to
        <span class="font-semibold text-on-surface">{{ board.currentCircle?.name }}</span>.
      </p>

      <p v-if="error" class="bg-error-container text-on-error-container rounded-lg px-stack-sm py-base text-body-md">
        {{ error }}
      </p>

      <template v-if="!inviteLink">
        <form class="flex flex-col gap-stack-sm" @submit.prevent="send">
          <div class="flex flex-col gap-base">
            <label class="font-label-md text-label-md text-on-surface" for="invite-email">Email address</label>
            <input
              id="invite-email"
              v-model="email"
              type="email"
              required
              placeholder="friend@example.com"
              class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-md"
            />
          </div>
          <button
            type="submit"
            :disabled="sending"
            class="w-full py-stack-sm rounded-full bg-primary text-on-primary font-label-md shadow-md hover:bg-primary-container hover:text-on-primary-container active:scale-95 transition-all disabled:opacity-60"
          >
            {{ sending ? 'Creating…' : 'Create invite link' }}
          </button>
        </form>
      </template>

      <template v-else>
        <div class="bg-primary-fixed/60 rounded-lg p-stack-sm flex flex-col gap-base">
          <span class="font-label-md text-label-md text-on-primary-container">Share this link</span>
          <code class="text-label-sm break-all text-on-surface">{{ inviteLink }}</code>
        </div>
        <button
          class="w-full py-stack-sm rounded-full bg-primary text-on-primary font-label-md shadow-md hover:bg-primary-container hover:text-on-primary-container active:scale-95 transition-all flex items-center justify-center gap-base"
          @click="copyLink"
        >
          <span class="material-symbols-outlined !text-[18px]">content_copy</span>
          Copy link
        </button>
        <button
          class="w-full py-stack-sm rounded-full border border-secondary text-secondary font-label-md active:scale-95 transition-all"
          @click="inviteLink = ''; email = ''"
        >
          Invite someone else
        </button>
      </template>
    </div>
  </BaseModal>
</template>
