<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';
import { apiErrorMessage } from '@/lib/api';
import type { User } from '@/types';

const router = useRouter();
const auth = useAuthStore();

const name = ref('');
const email = ref('');
const avatarColor = ref('');
const saving = ref(false);
const success = ref('');
const error = ref('');

const AVATAR_COLORS = ['#8fa998', '#ecbbba', '#cec2d9', '#b2cdbb', '#fdcbcb', '#aa9eb5', '#7b5455', '#645a6f', '#4c6455', '#d4a574'];

onMounted(() => {
  if (auth.user) {
    name.value = auth.user.name;
    email.value = auth.user.email;
    avatarColor.value = auth.user.avatarColor;
  }
});

async function save() {
  error.value = '';
  success.value = '';
  saving.value = true;
  try {
    const { data } = await api.patch<{ user: User }>('/auth/me', {
      name: name.value,
      email: email.value,
      avatarColor: avatarColor.value,
    });
    auth.user = data.user;
    success.value = 'Profile updated!';
  } catch (err) {
    error.value = apiErrorMessage(err);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <header class="bg-surface border-b border-surface-container">
      <div class="flex items-center gap-base px-container-padding-mobile sm:px-container-padding-desktop py-stack-sm max-w-[640px] mx-auto">
        <button
          class="flex items-center gap-1 text-on-surface-variant hover:text-on-surface transition-colors"
          @click="router.back()"
        >
          <span class="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 class="font-headline-md text-on-surface">Profile</h1>
      </div>
    </header>

    <main class="max-w-[640px] mx-auto px-container-padding-mobile sm:px-container-padding-desktop py-stack-lg">
      <!-- Avatar preview -->
      <div class="flex flex-col items-center gap-stack-sm mb-stack-lg">
        <span
          class="w-20 h-20 rounded-full flex items-center justify-center text-on-primary text-3xl font-bold shadow-md transition-colors"
          :style="{ backgroundColor: avatarColor }"
        >
          {{ name.charAt(0).toUpperCase() || '?' }}
        </span>
        <p class="text-body-sm text-on-surface-variant">Choose your avatar color</p>

        <!-- Color picker -->
        <div class="flex flex-wrap gap-2 justify-center">
          <button
            v-for="color in AVATAR_COLORS"
            :key="color"
            class="w-9 h-9 rounded-full border-2 transition-all hover:scale-110"
            :class="avatarColor === color ? 'border-on-surface scale-110 ring-2 ring-primary' : 'border-transparent'"
            :style="{ backgroundColor: color }"
            :title="color"
            @click="avatarColor = color"
          />
        </div>
      </div>

      <!-- Form -->
      <form class="flex flex-col gap-stack-sm" @submit.prevent="save">
        <div>
          <label class="block font-label-md text-on-surface-variant mb-1" for="profile-name">Name</label>
          <input
            id="profile-name"
            v-model="name"
            type="text"
            required
            maxlength="80"
            class="w-full rounded-xl border border-surface-container bg-surface px-stack-sm py-3 text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label class="block font-label-md text-on-surface-variant mb-1" for="profile-email">Email</label>
          <input
            id="profile-email"
            v-model="email"
            type="email"
            required
            class="w-full rounded-xl border border-surface-container bg-surface px-stack-sm py-3 text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <!-- Feedback -->
        <p v-if="error" class="bg-error-container text-on-error-container rounded-lg px-stack-sm py-2 text-body-sm">
          {{ error }}
        </p>
        <p v-if="success" class="bg-primary-container text-on-surface rounded-lg px-stack-sm py-2 text-body-sm">
          {{ success }}
        </p>

        <button
          type="submit"
          :disabled="saving"
          class="mt-stack-sm bg-primary text-on-primary font-label-md px-stack-md py-3 rounded-full hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
        >
          {{ saving ? 'Saving...' : 'Save Changes' }}
        </button>
      </form>
    </main>
  </div>
</template>
