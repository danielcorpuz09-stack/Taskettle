<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { apiErrorMessage } from '@/lib/api';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const form = reactive({ email: '', password: '' });
const showPassword = ref(false);
const error = ref('');
const loading = ref(false);

async function submit() {
  error.value = '';
  loading.value = true;
  try {
    await auth.login({ email: form.email, password: form.password });
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/';
    await router.push(redirect);
  } catch (err) {
    error.value = apiErrorMessage(err, 'Could not sign in');
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
        <h1 class="font-headline-xl text-headline-xl text-primary">Taskettle</h1>
        <p class="font-body-md text-body-md text-on-surface-variant max-w-[320px]">
          Effortless coordination for your household and circles.
        </p>
      </header>

      <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex flex-col gap-stack-md shadow-card">
        <div class="flex flex-col gap-base">
          <h2 class="font-headline-lg text-headline-lg text-on-surface">Welcome back</h2>
          <p class="font-body-md text-body-md text-on-surface-variant">
            Enter your details to access your boards.
          </p>
        </div>

        <p v-if="error" class="bg-error-container text-on-error-container rounded-lg px-stack-sm py-base text-body-md">
          {{ error }}
        </p>

        <form class="flex flex-col gap-stack-sm" @submit.prevent="submit">
          <div class="flex flex-col gap-base">
            <label class="font-label-md text-label-md text-on-surface ml-1" for="email">Email address</label>
            <div class="relative">
              <span class="material-symbols-outlined absolute left-stack-sm top-1/2 -translate-y-1/2 text-outline">mail</span>
              <input
                id="email"
                v-model="form.email"
                type="email"
                required
                placeholder="name@example.com"
                class="w-full pl-stack-lg pr-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-body-md text-body-md outline-none"
              />
            </div>
          </div>

          <div class="flex flex-col gap-base">
            <label class="font-label-md text-label-md text-on-surface ml-1" for="password">Password</label>
            <div class="relative">
              <span class="material-symbols-outlined absolute left-stack-sm top-1/2 -translate-y-1/2 text-outline">lock</span>
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                required
                placeholder="••••••••"
                class="w-full pl-stack-lg pr-stack-sm py-stack-sm bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-body-md text-body-md outline-none"
              />
              <button
                type="button"
                class="absolute right-stack-sm top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                @click="showPassword = !showPassword"
              >
                <span class="material-symbols-outlined">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-primary text-on-primary font-label-md text-label-md py-stack-sm rounded-full shadow-md hover:bg-primary-container hover:text-on-primary-container active:scale-[0.98] transition-all mt-base disabled:opacity-60"
          >
            {{ loading ? 'Signing in…' : 'Sign In' }}
          </button>
        </form>
      </div>

      <p class="text-center font-body-md text-body-md text-on-surface-variant">
        New to Taskettle?
        <RouterLink to="/register" class="text-primary font-label-md hover:underline">Create an account</RouterLink>
      </p>
    </main>
  </div>
</template>
