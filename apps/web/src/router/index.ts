import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/sign-in',
      name: 'sign-in',
      component: () => import('@/views/SignInView.vue'),
      meta: { public: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { public: true },
    },
    {
      path: '/invite/:token',
      name: 'accept-invite',
      component: () => import('@/views/AcceptInviteView.vue'),
    },
    {
      path: '/',
      name: 'board',
      component: () => import('@/views/BoardView.vue'),
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/ProfileView.vue'),
    },
    {
      path: '/inventory',
      name: 'inventory',
      component: () => import('@/views/InventoryView.vue'),
    },
    {
      path: '/wallet',
      name: 'wallet',
      component: () => import('@/views/WalletView.vue'),
    },
    {
      path: '/assets',
      name: 'assets',
      component: () => import('@/views/AssetsView.vue'),
    },
    {
      path: '/recurring-expenses',
      name: 'recurring-expenses',
      component: () => import('@/views/RecurringExpensesView.vue'),
    },
    {
      path: '/vehicles',
      name: 'vehicles',
      component: () => import('@/views/VehiclesView.vue'),
    },
    {
      path: '/maintenance',
      name: 'maintenance',
      component: () => import('@/views/MaintenanceView.vue'),
    },
    {
      path: '/business',
      name: 'business',
      component: () => import('@/views/BusinessView.vue'),
    },
    {
      path: '/business/:businessId',
      name: 'business-detail',
      component: () => import('@/views/BusinessDetailView.vue'),
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (!to.meta.public && !auth.isAuthenticated) {
    return { name: 'sign-in', query: to.fullPath !== '/' ? { redirect: to.fullPath } : undefined };
  }
  if (to.meta.public && auth.isAuthenticated) {
    return { name: 'board' };
  }
  return true;
});

export default router;
