<template>
  <n-layout has-sider class="layout">
    <n-layout-sider class="sidebar" width="200" bordered>
      <div class="sidebar-inner">
        <div>
          <h5 class="mb-2">CloudFrontend</h5>
          <n-menu
            :value="activeMenu"
            :options="menuOptions"
            @update:value="onMenuSelect"
          />
        </div>
        <div class="get-started">
          <template v-if="isLoggedIn">
            <n-dropdown
              trigger="click"
              placement="top-start"
              :options="userMenuOptions"
              :min-width="dropdownWidth"
              :max-width="dropdownWidth"
              :content-style="{ paddingLeft: '0px', paddingRight: '0px' }"
              @update:show="
                (v) => {
                  if (v) measureDropdownWidth()
                }
              "
              @select="onUserMenuSelect"
            >
              <div class="user-trigger" ref="triggerRef">
                <n-button type="primary" block>
                  {{ displayName || userName || 'Account' }}
                </n-button>
              </div>
            </n-dropdown>
          </template>
          <template v-else>
            <div class="user-trigger" ref="triggerRef">
              <n-dropdown
                trigger="click"
                placement="top-start"
                :options="authMenuOptions"
                :min-width="dropdownWidth"
                :max-width="dropdownWidth"
                :content-style="{ paddingLeft: '0px', paddingRight: '0px' }"
                @update:show="
                  (v) => {
                    if (v) measureDropdownWidth()
                  }
                "
                @select="onAuthMenuSelect"
              >
                <div class="user-trigger">
                  <n-button type="primary" block> Get Started </n-button>
                </div>
              </n-dropdown>
            </div>
          </template>
        </div>
      </div>
    </n-layout-sider>

    <n-layout-content class="content">
      <router-view />
    </n-layout-content>
  </n-layout>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, nextTick, watch, computed } from 'vue'
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

// measure dropdown width to exactly match trigger (button) width
const triggerRef = ref<HTMLElement | null>(null)
const dropdownWidth = ref<number>(0)
const measureDropdownWidth = () => {
  if (triggerRef.value) {
    dropdownWidth.value = triggerRef.value.offsetWidth || 0
  }
}
onMounted(async () => {
  await nextTick()
  measureDropdownWidth()
  window.addEventListener('resize', measureDropdownWidth)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', measureDropdownWidth)
})
watch(isLoggedIn, async () => {
  await nextTick()
  measureDropdownWidth()
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

<style scoped>
.layout {
  height: 100vh;
}
.sidebar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 8px;
  box-sizing: border-box;
  border-right: 1px solid #e5e7eb;
  height: 100vh;
  justify-content: space-between;
}
.sidebar-inner {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 100%;
  height: 100%;
}
.get-started {
  margin-top: auto;
  width: 180px;
  padding-bottom: 8px;
}
.user-trigger {
  width: 180px;
}
.content {
  padding: 16px;
  box-sizing: border-box;
  overflow: auto;
}
</style>

<style>
/* Extra global styles no longer needed for dropdown width; kept empty intentionally */
</style>
