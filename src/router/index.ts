import { createRouter, createWebHistory } from 'vue-router'
import { getTokenCookies } from '@/utils/userUtils'

import Layout from '@/layout/index.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/auth',
      name: 'AuthSplit',
      component: () => import('@/views/auth/auth-split.vue'),
    },
    {
      path: '/auth-preview',
      name: 'AuthSplitPreview',
      component: () => import('@/views/auth/auth-split.vue'),
    },
    {
      path: '/logout',
      name: 'Logout',
      component: () => import('@/views/auth/logout.vue'),
    },
    {
      path: '/share/:code',
      name: 'ShareDownload',
      component: () => import('@/views/drop/share.vue'),
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
          // support nested path like /drive/path/to/folder
          path: '/drive/:pathMatch(.*)*',
          name: 'DrivePath',
          component: () => import('@/views/drive/index.vue'),
        },
        {
          path: '/settings',
          name: 'Settings',
          component: () => import('@/views/settings/index.vue'),
        },
        {
          path: '/share',
          name: 'Share',
          component: () => import('@/views/share/index.vue'),
        },
      ],
    },
  ],
})

// Require auth for routes not in whiteList and not under /share
const whiteList = ['/', '/auth', '/auth-preview']
router.beforeEach((to, _from, next) => {
  if (whiteList.includes(to.path) || to.path.startsWith('/share')) return next()
  const { access, refresh } = getTokenCookies()
  if (access && refresh) return next()
  next({ path: '/auth', query: { redirect: to.fullPath } })
})

export default router
