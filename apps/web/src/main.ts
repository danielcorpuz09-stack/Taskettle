import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { setUnauthorizedHandler } from './lib/api';
import { useAuthStore } from './stores/auth';
import { useNotificationStore } from './stores/notifications';
import './assets/main.css';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);

// When any request 401s, clear session and bounce to sign-in.
setUnauthorizedHandler(() => {
  useAuthStore().logout();
  useNotificationStore().reset();
  void router.push({ name: 'sign-in' });
});

app.mount('#app');
