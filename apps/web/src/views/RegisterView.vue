<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { apiErrorMessage } from '@/lib/api';

const auth = useAuthStore();
const router = useRouter();

const form = reactive({ name: '', email: '', password: '' });
const error = ref('');
const loading = ref(false);

async function submit() {
  error.value = '';
  loading.value = true;
  try {
    await auth.register({ ...form });
    await router.push('/');
  } catch (err) {
    error.value = apiErrorMessage(err, 'Could not create account');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col justify-center items-center p-base">
    <main class="w-full max-w-[440px] flex flex-col gap-stack-lg">
      <header class="text-center flex flex-col items-center gap-base">
        <div class="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mb-stack-sm shadow-md">
          <span class="material-symbols-outlined text-on-primary !text-[40px]">task_alt</span>
        </div>
        <h1 class="font-headline-xl text-headline-xl text-primary">Join Taskettle</h1>
        <p class="font-body-md text-body-md text-on-surface-variant max-w-[320px]">
          Start coordinating with your circle in minutes.
        </p>
      </header>

      <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex flex-col gap-stack-md shadow-card">
        <p v-if="error" class="bg-error-container text-on-error-container rounded-lg px-stack-sm py-base text-body-md">
          {{ error }}
        </p>

        <form class="flex flex-col gap-stack-sm" @submit.prevent="submit">
          <div class="flex flex-col gap-base">
            <label class="font-label-md text-label-md text-on-surface ml-1" for="name">Your name</label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              placeholder="Mei"
              class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-body-md text-body-md outline-none"
            />
          </div>

          <div class="flex flex-col gap-base">
            <label class="font-label-md text-label-md text-on-surface ml-1" for="email">Email address</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              placeholder="name@example.com"
              class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-body-md text-body-md outline-none"
            />
          </div>

          <div class="flex flex-col gap-base">
            <label class="font-label-md text-label-md text-on-surface ml-1" for="password">Password</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              minlength="8"
              placeholder="At least 8 characters"
              class="w-full px-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-body-md text-body-md outline-none"
            />
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-primary text-on-primary font-label-md text-label-md py-stack-sm rounded-full shadow-md hover:bg-primary-container hover:text-on-primary-container active:scale-[0.98] transition-all mt-base disabled:opacity-60"
          >
            {{ loading ? 'Creating…' : 'Create account' }}
          </button>
        </form>
      </div>

      <p class="text-center font-body-md text-body-md text-on-surface-variant">
        Already have an account?
        <RouterLink to="/sign-in" class="text-primary font-label-md hover:underline">Sign in</RouterLink>
      </p>
    </main>
  </div>
</template>
