import { createRouter, createWebHistory } from 'vue-router'

import Layout from '@/layout/index.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/login/auth.vue'),
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('@/views/login/auth.vue'),
    },
    {
      path: '/auth',
      name: 'Auth',
      component: () => import('@/views/login/auth.vue'),
    },
    {
      path: '/',
      component: Layout,
      children: [
        {
          path: '',
          name: 'Home',
          component: () => import('@/views/home/index.vue'),
        },
        {
          path: '/drive',
          name: 'Drive',
          component: () => import('@/views/drive/index.vue'),
        },
        {
          path: '/settings',
          name: 'Settings',
          component: () => import('@/views/settings/index.vue'),
        },
      ],
    },
  ],
})

export default router
