<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api, apiErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const status = ref<'loading' | 'done' | 'error'>('loading');
const message = ref('');
const circleName = ref('');

async function accept() {
  // Ensure we know who the user is (token may have just been set).
  if (!auth.user) {
    try {
      await auth.fetchMe();
    } catch {
      /* handled by interceptor */
    }
  }
  try {
    const { data } = await api.post<{ circle: { name: string } }>(
      `/invites/${route.params.token}/accept`
    );
    circleName.value = data.circle.name;
    status.value = 'done';
  } catch (err) {
    message.value = apiErrorMessage(err, 'This invitation could not be accepted');
    status.value = 'error';
  }
}

accept();
</script>

<template>
  <div class="min-h-screen flex flex-col justify-center items-center p-base">
    <main class="w-full max-w-[440px] bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md shadow-card text-center flex flex-col items-center gap-stack-sm">
      <template v-if="status === 'loading'">
        <span class="material-symbols-outlined !text-[40px] text-primary animate-pulse">hourglass_top</span>
        <p class="text-body-md text-on-surface-variant">Joining the circle…</p>
      </template>

      <template v-else-if="status === 'done'">
        <div class="w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
          <span class="material-symbols-outlined text-on-primary !text-[40px]">celebration</span>
        </div>
        <h1 class="font-headline-lg text-headline-lg text-on-surface">You're in!</h1>
        <p class="text-body-md text-on-surface-variant">
          Welcome to <span class="font-semibold text-on-surface">{{ circleName }}</span>.
        </p>
        <button
          class="mt-base w-full py-stack-sm rounded-full bg-primary text-on-primary font-label-md shadow-md hover:bg-primary-container hover:text-on-primary-container active:scale-95 transition-all"
          @click="router.push('/')"
        >
          Go to the board
        </button>
      </template>

      <template v-else>
        <div class="w-16 h-16 bg-error-container rounded-xl flex items-center justify-center">
          <span class="material-symbols-outlined text-on-error-container !text-[40px]">link_off</span>
        </div>
        <h1 class="font-headline-lg text-headline-lg text-on-surface">Invitation problem</h1>
        <p class="text-body-md text-on-surface-variant">{{ message }}</p>
        <button
          class="mt-base w-full py-stack-sm rounded-full border border-secondary text-secondary font-label-md active:scale-95 transition-all"
          @click="router.push('/')"
        >
          Back to Taskettle
        </button>
      </template>
    </main>
  </div>
</template>
