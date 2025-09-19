<template>
  <n-layout has-sider class="h-screen">
    <n-layout-sider
      class="flex flex-col justify-between gap-3 box-border p-3 pr-2 border-r border-gray-200 h-screen"
      width="200"
      bordered
    >
      <div class="flex flex-col justify-between min-h-full h-full">
        <div>
          <h5 class="mb-2 font-semibold">CloudFrontend</h5>
          <n-menu
            :value="activeMenu"
            :options="menuOptions"
            @update:value="onMenuSelect"
          />
        </div>
        <div class="mt-auto pb-2">
          <template v-if="isLoggedIn">
            <n-dropdown
              trigger="click"
              placement="top-start"
              :options="userMenuOptions"
              width="trigger"
              @select="onUserMenuSelect"
            >
              <div class="w-full">
                <n-button type="primary" block>
                  {{ displayName || userName || 'Account' }}
                </n-button>
              </div>
            </n-dropdown>
          </template>
          <template v-else>
            <n-dropdown
              trigger="click"
              placement="top-start"
              :options="authMenuOptions"
              width="trigger"
              @select="onAuthMenuSelect"
            >
              <div class="w-full">
                <n-button type="primary" block> Get Started </n-button>
              </div>
            </n-dropdown>
          </template>
        </div>
      </div>
    </n-layout-sider>

    <n-layout-content class="p-4 box-border overflow-auto">
      <router-view />
    </n-layout-content>
  </n-layout>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue'
import type { MenuOption } from 'naive-ui'
import { getUserInfo, refreshAccessToken } from '@/api/users/api'
import { getTokenCookies, setTokenCookies } from '@/utils/userUtils'
import { useRouter } from 'vue-router'

// menu
const menuOptions: MenuOption[] = [{ label: 'Drive', key: '/drive' }]
const router = useRouter()
const onMenuSelect = (key: string) => {
  if (key && key !== router.currentRoute.value.path) router.push(key)
}

// keep menu active on nested routes
const activeMenu = computed(() => {
  const path = router.currentRoute.value.path
  if (path.startsWith('/drive')) return '/drive'
  return path
})

//UserInfo
const isLoggedIn = ref(false)
const userName = ref('')
const displayName = ref('')

onMounted(async () => {
  try {
    const { access, refresh } = getTokenCookies()
    if (access && refresh) {
      try {
        const refreshTokens = await refreshAccessToken()
        setTokenCookies(refreshTokens.access, refreshTokens.refresh)
      } catch (e) {
        console.warn('Token refresh failed, using existing token')
      }
      const res = await getUserInfo()
      userName.value =
        (res as any).user?.username ?? (res as any).username ?? ''
      displayName.value =
        (res as any).user?.display_name ?? (res as any).display_name ?? ''
      isLoggedIn.value = true
    } else {
      isLoggedIn.value = false
    }
  } catch (e) {
    isLoggedIn.value = false
  }
})

// user dropdown
const userMenuOptions: MenuOption[] = [
  { label: 'Settings', key: 'settings' },
  { label: 'Logout', key: 'logout' },
]
const onUserMenuSelect = (key: string) => {
  if (key === 'settings') router.push('/settings')
  else if (key === 'logout') router.push('/logout')
}

const authMenuOptions: MenuOption[] = [
  { label: 'Register', key: 'register' },
  { label: 'Login', key: 'login' },
]
const onAuthMenuSelect = (key: string) => {
  if (key === 'register') router.push('/register')
  else if (key === 'login') router.push('/login')
}
</script>
