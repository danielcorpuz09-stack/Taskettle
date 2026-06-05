<script setup lang="ts">
import { ref } from 'vue';
import { useNotificationStore } from '@/stores/notifications';
import { formatDueLabel } from '@/lib/date';

const notifications = useNotificationStore();
const open = ref(false);

function toggle() {
  open.value = !open.value;
}
</script>

<template>
  <div class="relative">
    <button
      class="relative text-on-surface-variant p-2 hover:bg-surface-container-highest rounded-full transition-colors"
      aria-label="Notifications"
      @click="toggle"
    >
      <span class="material-symbols-outlined">notifications</span>
      <span
        v-if="notifications.unread > 0"
        class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-secondary text-on-secondary text-[11px] font-semibold flex items-center justify-center"
      >
        {{ notifications.unread > 9 ? '9+' : notifications.unread }}
      </span>
    </button>

    <div
      v-if="open"
      class="absolute right-0 mt-2 w-[320px] max-h-[420px] overflow-y-auto bg-surface-container-lowest rounded-xl shadow-float border border-outline-variant/50 z-50"
    >
      <header class="flex items-center justify-between px-stack-sm py-base border-b border-outline-variant/50">
        <span class="font-headline text-body-md font-semibold text-on-surface">Reminders</span>
        <button
          v-if="notifications.unread > 0"
          class="text-label-sm text-primary hover:underline"
          @click="notifications.markAllRead()"
        >
          Mark all read
        </button>
      </header>

      <ul v-if="notifications.items.length" class="divide-y divide-outline-variant/40">
        <li
          v-for="n in notifications.items"
          :key="n.id"
          class="px-stack-sm py-stack-sm flex gap-base items-start hover:bg-surface-container-low cursor-pointer"
          :class="{ 'bg-surface-container-low/60': !n.read }"
          @click="notifications.markRead(n.id)"
        >
          <span
            class="material-symbols-outlined !text-[20px] mt-0.5"
            :class="n.type === 'OVERDUE' ? 'text-error' : 'text-secondary'"
          >
            {{ n.type === 'OVERDUE' ? 'warning' : 'schedule' }}
          </span>
          <div class="flex-1">
            <p class="text-body-md text-on-surface leading-snug">{{ n.message }}</p>
            <p class="text-label-sm text-on-surface-variant">{{ formatDueLabel(n.createdAt) }}</p>
          </div>
          <span v-if="!n.read" class="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></span>
        </li>
      </ul>
      <p v-else class="px-stack-sm py-stack-lg text-center text-body-md text-on-surface-variant">
        You're all caught up. 🌿
      </p>
    </div>
  </div>
</template>
